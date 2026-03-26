import { prisma } from '../config/database';
import { googleCalendarService } from './GoogleCalendarService';

class CalendarSyncScheduler {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  start(): void {
    if (this.syncInterval) {
      console.log('Calendar sync scheduler already running');
      return;
    }

    console.log('Starting calendar sync scheduler...');
    
    // Run initial sync
    this.syncAllOrganizations();

    // Schedule periodic syncs
    this.syncInterval = setInterval(() => {
      this.syncAllOrganizations();
    }, this.SYNC_INTERVAL_MS);
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Calendar sync scheduler stopped');
    }
  }

  async syncAllOrganizations(): Promise<void> {
    try {
      // Get all organizations with calendar sync enabled
      const configs = await prisma.googleCalendarConfig.findMany({
        where: { syncEnabled: true },
        include: { organization: true },
      });

      console.log(`Syncing calendars for ${configs.length} organizations...`);

      for (const config of configs) {
        try {
          const result = await googleCalendarService.syncEvents(config.organizationId);
          console.log(
            `Synced ${result.synced} events for ${config.organization.name} (created: ${result.created}, updated: ${result.updated})`,
          );
        } catch (error) {
          console.error(`Error syncing calendar for org ${config.organizationId}:`, error);
          // Continue with next organization even if one fails
        }
      }
    } catch (error) {
      console.error('Error in calendar sync scheduler:', error);
    }
  }

  async syncOrganization(organizationId: string): Promise<void> {
    try {
      const result = await googleCalendarService.syncEvents(organizationId);
      console.log(
        `Manual sync for ${organizationId}: ${result.synced} events (created: ${result.created}, updated: ${result.updated})`,
      );
    } catch (error) {
      console.error(`Error syncing organization ${organizationId}:`, error);
      throw error;
    }
  }
}

export const calendarSyncScheduler = new CalendarSyncScheduler();
