import type { Request } from 'express';

/**
 * Utility class for extracting client IP addresses from HTTP requests
 * Handles various proxy configurations and deployment scenarios
 */
export class IpExtractionUtil {
  /**
   * Extract the real client IP address from request headers
   * Handles proxies, load balancers, CDNs, and direct connections
   *
   * @param req - Express request object
   * @returns The client IP address or 'unknown' if not determinable
   */
  static extractClientIp(req: Request): string {
    // Check for forwarded headers (most common in production)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
      // The first IP is usually the original client
      const forwardedIp = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor;

      if (typeof forwardedIp === 'string') {
        const clientIp = forwardedIp.split(',')[0].trim();
        if (this.isValidIp(clientIp)) {
          return clientIp;
        }
      }
    }

    // Check X-Real-IP header (nginx proxy)
    const xRealIp = req.headers['x-real-ip'];
    if (typeof xRealIp === 'string' && this.isValidIp(xRealIp)) {
      return xRealIp;
    }

    // Check X-Client-IP header (some proxies)
    const xClientIp = req.headers['x-client-ip'];
    if (typeof xClientIp === 'string' && this.isValidIp(xClientIp)) {
      return xClientIp;
    }

    // Check CF-Connecting-IP (Cloudflare)
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    if (typeof cfConnectingIp === 'string' && this.isValidIp(cfConnectingIp)) {
      return cfConnectingIp;
    }

    // Check True-Client-IP (Cloudflare Enterprise)
    const trueClientIp = req.headers['true-client-ip'];
    if (typeof trueClientIp === 'string' && this.isValidIp(trueClientIp)) {
      return trueClientIp;
    }

    // Fallback to connection remote address
    const connectionRemoteAddress = req.connection?.remoteAddress;
    if (
      typeof connectionRemoteAddress === 'string' &&
      this.isValidIp(connectionRemoteAddress)
    ) {
      return connectionRemoteAddress;
    }

    // Fallback to socket remote address
    const socketRemoteAddress = req.socket?.remoteAddress;
    if (
      typeof socketRemoteAddress === 'string' &&
      this.isValidIp(socketRemoteAddress)
    ) {
      return socketRemoteAddress;
    }

    // Last resort: Express req.ip
    if (req.ip && typeof req.ip === 'string' && this.isValidIp(req.ip)) {
      return req.ip;
    }

    // Unable to determine IP
    return 'unknown';
  }

  /**
   * Validate if a string is a valid IP address (IPv4 or IPv6)
   * Also filters out private/internal IPs in certain cases
   *
   * @param ip - IP address string to validate
   * @returns True if the IP is valid and usable
   */
  private static isValidIp(ip: string): boolean {
    if (!ip || typeof ip !== 'string') {
      return false;
    }

    // Remove any surrounding whitespace
    ip = ip.trim();

    // IPv4 validation
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6 validation (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

    // Check if it matches IPv4 or IPv6 format
    if (ipv4Regex.test(ip) || ipv6Regex.test(ip)) {
      // Filter out obviously invalid IPs
      if (ip === '0.0.0.0' || ip === '::' || ip.startsWith('127.')) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Get a sanitized IP for logging/storage
   * Ensures the IP is safe to store in database
   *
   * @param req - Express request object
   * @returns Sanitized IP address
   */
  static getSanitizedIp(req: Request): string {
    const ip = this.extractClientIp(req);

    // Ensure IP is not too long (database field limits)
    if (ip.length > 45) {
      // IPv6 max length is 39, add some buffer
      return 'unknown';
    }

    // Remove any potential injection characters (extra safety)
    return ip.replace(/[^\w.:]/g, '');
  }
}
