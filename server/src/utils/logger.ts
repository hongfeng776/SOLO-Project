class Logger {
  private static getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  public static info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${this.getTimestamp()} - ${message}`, ...args);
  }

  public static warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${this.getTimestamp()} - ${message}`, ...args);
  }

  public static error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${this.getTimestamp()} - ${message}`, ...args);
  }

  public static debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${this.getTimestamp()} - ${message}`, ...args);
    }
  }
}

export default Logger;
