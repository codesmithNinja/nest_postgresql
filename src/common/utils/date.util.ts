import moment from 'moment-timezone';

export class DateUtil {
  /**
   * Calculate actual start date time based on date, time, and timezone
   */
  static calculateActualStartDateTime(
    startDate: Date,
    startTime: string,
    timezone: string
  ): Date {
    try {
      // Parse the date and time in the specified timezone
      const dateString = moment(startDate).format('YYYY-MM-DD');
      const dateTimeString = `${dateString} ${startTime}`;

      // Create moment object in specified timezone
      const momentDateTime = moment.tz(
        dateTimeString,
        'YYYY-MM-DD HH:mm',
        timezone
      );

      // Convert to UTC for storage
      return momentDateTime.utc().toDate();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid date/time combination: ${errorMessage}`);
    }
  }

  /**
   * Check if a date is in the future
   */
  static isFutureDate(date: Date): boolean {
    return moment(date).isAfter(moment());
  }

  /**
   * Check if a date is in the past
   */
  static isPastDate(date: Date): boolean {
    return moment(date).isBefore(moment());
  }

  /**
   * Format date for display
   */
  static formatDate(
    date: Date,
    format: string = 'YYYY-MM-DD HH:mm:ss'
  ): string {
    return moment(date).format(format);
  }

  /**
   * Convert UTC date to timezone
   */
  static toTimezone(date: Date, timezone: string): string {
    return moment.utc(date).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Validate timezone string
   */
  static isValidTimezone(timezone: string): boolean {
    return moment.tz.zone(timezone) !== null;
  }

  /**
   * Get current timestamp
   */
  static now(): Date {
    return new Date();
  }

  /**
   * Add time to date
   */
  static addTime(
    date: Date,
    amount: number,
    unit: moment.unitOfTime.DurationConstructor
  ): Date {
    return moment(date).add(amount, unit).toDate();
  }

  /**
   * Subtract time from date
   */
  static subtractTime(
    date: Date,
    amount: number,
    unit: moment.unitOfTime.DurationConstructor
  ): Date {
    return moment(date).subtract(amount, unit).toDate();
  }
}
