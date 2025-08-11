import { PrismaClient, SaleStatus, CommissionStatus } from "@prisma/client";
import axios from "axios";
import crypto from "crypto";

const prisma = new PrismaClient();

export interface SaleData {
  orderId: string;
  businessId: number;
  userId?: number;
  productUrl: string;
  productTitle?: string;
  productPrice: number;
  currency?: string;
  retailer: string;
  sessionId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface WebhookPayload {
  orderId: string;
  businessId: number;
  productUrl: string;
  productTitle?: string;
  productPrice: number;
  currency?: string;
  retailer: string;
  status: SaleStatus;
  customerEmail?: string;
  customerId?: string;
}

export class SalesTrackingService {
  // Track a new sale
  static async trackSale(saleData: SaleData) {
    try {
      // Check if sale already exists
      const existingSale = await prisma.sale.findUnique({
        where: { orderId: saleData.orderId },
      });

      if (existingSale) {
        console.log(`Sale with orderId ${saleData.orderId} already exists`);
        return existingSale;
      }

      // Get commission rate for this business and retailer
      const commissionRate = await prisma.commissionRate.findUnique({
        where: {
          businessId_retailer: {
            businessId: saleData.businessId,
            retailer: saleData.retailer,
          },
        },
      });

      const rate = commissionRate?.rate || 0;
      const commissionAmount = (saleData.productPrice * rate) / 100;

      // Create the sale record
      const sale = await prisma.sale.create({
        data: {
          orderId: saleData.orderId,
          businessId: saleData.businessId,
          userId: saleData.userId,
          productUrl: saleData.productUrl,
          productTitle: saleData.productTitle,
          productPrice: saleData.productPrice,
          currency: saleData.currency || "USD",
          retailer: saleData.retailer,
          sessionId: saleData.sessionId,
          referrer: saleData.referrer,
          utmSource: saleData.utmSource,
          utmMedium: saleData.utmMedium,
          utmCampaign: saleData.utmCampaign,
          ipAddress: saleData.ipAddress,
          userAgent: saleData.userAgent,
          commissionAmount,
          commissionRate: rate,
          status: SaleStatus.PENDING,
        },
      });

      // If there's a user, create commission record
      if (saleData.userId) {
        await prisma.commission.create({
          data: {
            saleId: sale.id,
            userId: saleData.userId,
            amount: commissionAmount,
            rate: rate,
            status: CommissionStatus.PENDING,
          },
        });
      }

      // Trigger webhooks for this sale
      await this.triggerWebhooks(sale.id, "sale.created", sale);

      console.log(
        `Sale tracked: ${saleData.orderId} for business ${saleData.businessId}`,
      );
      return sale;
    } catch (error) {
      console.error("Error tracking sale:", error);
      throw error;
    }
  }

  // Update sale status (e.g., when payment is confirmed)
  static async updateSaleStatus(orderId: string, status: SaleStatus) {
    try {
      const sale = await prisma.sale.update({
        where: { orderId },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          commissions: true,
        },
      });

      // Update commission status based on sale status
      if (status === SaleStatus.CONFIRMED) {
        await prisma.commission.updateMany({
          where: { saleId: sale.id },
          data: { status: CommissionStatus.APPROVED },
        });
      } else if (
        status === SaleStatus.CANCELLED ||
        status === SaleStatus.REFUNDED
      ) {
        await prisma.commission.updateMany({
          where: { saleId: sale.id },
          data: { status: CommissionStatus.CANCELLED },
        });
      }

      // Trigger webhook for status update
      await this.triggerWebhooks(sale.id, "sale.status_updated", sale);

      return sale;
    } catch (error) {
      console.error("Error updating sale status:", error);
      throw error;
    }
  }

  // Mark commission as paid
  static async markCommissionPaid(saleId: number) {
    try {
      const sale = await prisma.sale.update({
        where: { id: saleId },
        data: {
          commissionPaid: true,
          commissionPaidAt: new Date(),
        },
      });

      await prisma.commission.updateMany({
        where: { saleId },
        data: {
          status: CommissionStatus.PAID,
          paidAt: new Date(),
        },
      });

      await this.triggerWebhooks(saleId, "commission.paid", sale);
      return sale;
    } catch (error) {
      console.error("Error marking commission paid:", error);
      throw error;
    }
  }

  // Get sales statistics for a business
  static async getBusinessSalesStats(
    businessId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      const whereClause: any = { businessId };

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      const sales = await prisma.sale.findMany({
        where: whereClause,
        include: {
          commissions: true,
        },
      });

      const totalSales = sales.length;
      const totalRevenue = sales.reduce(
        (sum, sale) => sum + sale.productPrice,
        0,
      );
      const totalCommission = sales.reduce(
        (sum, sale) => sum + (sale.commissionAmount || 0),
        0,
      );
      const confirmedSales = sales.filter(
        (sale) => sale.status === SaleStatus.CONFIRMED,
      ).length;
      const pendingSales = sales.filter(
        (sale) => sale.status === SaleStatus.PENDING,
      ).length;

      return {
        totalSales,
        totalRevenue,
        totalCommission,
        confirmedSales,
        pendingSales,
        conversionRate:
          totalSales > 0 ? (confirmedSales / totalSales) * 100 : 0,
      };
    } catch (error) {
      console.error("Error getting business sales stats:", error);
      throw error;
    }
  }

  // Get user commission statistics
  static async getUserCommissionStats(
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      const whereClause: any = { userId };

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      const commissions = await prisma.commission.findMany({
        where: whereClause,
        include: {
          sale: true,
        },
      });

      const totalCommissions = commissions.length;
      const totalAmount = commissions.reduce(
        (sum, commission) => sum + commission.amount,
        0,
      );
      const paidCommissions = commissions.filter(
        (commission) => commission.status === CommissionStatus.PAID,
      ).length;
      const pendingCommissions = commissions.filter(
        (commission) => commission.status === CommissionStatus.PENDING,
      ).length;

      return {
        totalCommissions,
        totalAmount,
        paidCommissions,
        pendingCommissions,
        averageCommission:
          totalCommissions > 0 ? totalAmount / totalCommissions : 0,
      };
    } catch (error) {
      console.error("Error getting user commission stats:", error);
      throw error;
    }
  }

  // Trigger webhooks for events
  private static async triggerWebhooks(
    saleId: number,
    eventType: string,
    payload: any,
  ) {
    try {
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        include: { business: true },
      });

      if (!sale) return;

      const webhooks = await prisma.webhook.findMany({
        where: {
          businessId: sale.businessId,
          isActive: true,
          events: {
            has: eventType,
          },
        },
      });

      for (const webhook of webhooks) {
        await this.sendWebhook(webhook, eventType, payload);
      }
    } catch (error) {
      console.error("Error triggering webhooks:", error);
    }
  }

  // Send webhook to external URL
  private static async sendWebhook(
    webhook: any,
    eventType: string,
    payload: any,
  ) {
    try {
      const webhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(JSON.stringify(webhookPayload))
        .digest("hex");

      const response = await axios.post(webhook.url, webhookPayload, {
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "User-Agent": "PriceHunt-Sales-Tracker/1.0",
        },
        timeout: 10000,
      });

      // Record successful webhook event
      await prisma.webhookEvent.create({
        data: {
          webhookId: webhook.id,
          eventType,
          payload: JSON.stringify(webhookPayload),
          status: "SENT",
          responseCode: response.status,
          responseBody: JSON.stringify(response.data),
        },
      });

      // Update webhook last triggered
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastTriggered: new Date() },
      });

      console.log(`Webhook sent successfully to ${webhook.url}`);
    } catch (error) {
      console.error(`Webhook failed for ${webhook.url}:`, error);

      // Record failed webhook event
      await prisma.webhookEvent.create({
        data: {
          webhookId: webhook.id,
          eventType,
          payload: JSON.stringify(payload),
          status: "FAILED",
          responseCode: error.response?.status,
          responseBody: error.message,
          retryCount: 0,
          nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
        },
      });
    }
  }

  // Retry failed webhooks
  static async retryFailedWebhooks() {
    try {
      const failedEvents = await prisma.webhookEvent.findMany({
        where: {
          status: "FAILED",
          retryCount: { lt: 3 },
          nextRetryAt: { lte: new Date() },
        },
        include: {
          webhook: true,
        },
      });

      for (const event of failedEvents) {
        try {
          const payload = JSON.parse(event.payload);

          const signature = crypto
            .createHmac("sha256", event.webhook.secret)
            .update(event.payload)
            .digest("hex");

          const response = await axios.post(event.webhook.url, payload, {
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": signature,
              "User-Agent": "PriceHunt-Sales-Tracker/1.0",
            },
            timeout: 10000,
          });

          // Update event as successful
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
              status: "SENT",
              responseCode: response.status,
              responseBody: JSON.stringify(response.data),
            },
          });

          console.log(`Retry successful for webhook event ${event.id}`);
        } catch (error) {
          // Update retry count and next retry time
          const newRetryCount = event.retryCount + 1;
          const nextRetryDelay = Math.pow(2, newRetryCount) * 5 * 60 * 1000; // Exponential backoff

          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
              retryCount: newRetryCount,
              nextRetryAt: new Date(Date.now() + nextRetryDelay),
              responseCode: error.response?.status,
              responseBody: error.message,
            },
          });

          console.log(
            `Retry failed for webhook event ${event.id}, attempt ${newRetryCount}`,
          );
        }
      }
    } catch (error) {
      console.error("Error retrying failed webhooks:", error);
    }
  }
}

export default SalesTrackingService;
