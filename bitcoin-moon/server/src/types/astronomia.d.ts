/**
 * Type declarations for astronomia library
 * Since @types/astronomia doesn't exist, we create minimal declarations for our use case
 */

declare module 'astronomia' {
  export interface JulianDate {
    jd: number;
    toDate(): Date;
  }

  export namespace solstice {
    /**
     * Calculate March equinox for a given year
     */
    function march(year: number): JulianDate;

    /**
     * Calculate June solstice for a given year
     */
    function june(year: number): JulianDate;

    /**
     * Calculate September equinox for a given year
     */
    function september(year: number): JulianDate;

    /**
     * Calculate December solstice for a given year
     */
    function december(year: number): JulianDate;
  }

  export namespace julian {
    /**
     * Convert Gregorian calendar date to Julian Date
     */
    function CalendarGregorianToJD(year: number, month: number, day: number): number;
  }
} 