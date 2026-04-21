// Test script to create dummy payment logs for testing
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createTestPaymentLogs() {
  try {
    console.log("🚀 Creating test payment logs...\n");

    // Create a few test logs
    const testLogs = await Promise.all([
      prisma.paymentLog.create({
        data: {
          orderId: "ORD-00001",
          paymentId: "PAY-TEST-001",
          statusCode: "2",
          status: "SUCCESS",
          rawPayload: {
            merchant_id: "test_merchant",
            order_id: "ORD-00001",
            payment_id: "PAY-TEST-001",
            status_code: "2",
            md5sig: "test",
            payhere_amount: "5000.00",
            payhere_currency: "LKR"
          }
        }
      }),
      prisma.paymentLog.create({
        data: {
          orderId: "ORD-00002",
          paymentId: "PAY-TEST-002",
          statusCode: "0",
          status: "RECEIVED",
          rawPayload: {
            merchant_id: "test_merchant",
            order_id: "ORD-00002",
            payment_id: "PAY-TEST-002",
            status_code: "0",
            payhere_amount: "3000.00",
            payhere_currency: "LKR"
          }
        }
      }),
      prisma.paymentLog.create({
        data: {
          orderId: "ORD-00003",
          paymentId: "PAY-TEST-003",
          statusCode: "1",
          status: "PAYMENT_FAILED_NOTIFY",
          rawPayload: {
            merchant_id: "test_merchant",
            order_id: "ORD-00003",
            payment_id: "PAY-TEST-003",
            status_code: "1",
            payhere_amount: "8500.00",
            payhere_currency: "LKR"
          }
        }
      })
    ]);

    console.log("✅ Successfully created test logs:\n");
    testLogs.forEach((log, i) => {
      console.log(`${i + 1}. Order: ${log.orderId} | Status: ${log.status} | ID: ${log.id}`);
    });

    const count = await prisma.paymentLog.count();
    console.log(`\n📊 Total payment logs in database: ${count}`);
  } catch (error) {
    console.error("❌ Error creating test logs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPaymentLogs();
