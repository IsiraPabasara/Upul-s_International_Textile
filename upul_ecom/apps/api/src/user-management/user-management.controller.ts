import { Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

/**
 * Get all users with pagination and search
 * Query params:
 * - search: string (search by name, email, phone)
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * - role: string (filter by role)
 * - sortBy: string (default: 'createdAt')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 */
export const getAllUsers = async (
  req: any,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    // Check admin authorization
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const {
      search = "",
      page = 1,
      limit = 10,
      role,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string) || 10),
    );
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    if (search) {
      filter.OR = [
        { firstname: { contains: search, mode: "insensitive" } },
        { lastname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phonenumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) {
      filter.role = role;
    }

    // Get total count
    const total = await prisma.users.count({ where: filter });

    // Get paginated users
    const users = await prisma.users.findMany({
      where: filter,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phonenumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        [sortBy]: sortOrder === "asc" ? "asc" : "desc",
      },
      skip,
      take: limitNum,
    });

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    next(error);
  }
};

/**
 * Get single user details with stats
 */
export const getUserDetails = async (
  req: any,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phonenumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get order stats
    const orders = await prisma.order.findMany({
      where: { userId: id },
      select: {
        totalAmount: true,
        status: true,
      },
    });

    const totalSpent = orders.reduce(
      (sum: number, order: any) => sum + order.totalAmount,
      0,
    );
    const orderStats = {
      total: orders.length,
      pending: orders.filter((o: any) => o.status === "PENDING").length,
      confirmed: orders.filter((o: any) => o.status === "CONFIRMED").length,
      processing: orders.filter((o: any) => o.status === "PROCESSING").length,
      shipped: orders.filter((o: any) => o.status === "SHIPPED").length,
      delivered: orders.filter((o: any) => o.status === "DELIVERED").length,
      cancelled: orders.filter((o: any) => o.status === "CANCELLED").length,
      totalSpent,
    };

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        orderStats,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    next(error);
  }
};

/**
 * Get user's order history
 */
export const getUserOrders = async (
  req: any,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Verify user exists
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const filter: any = { userId: id };
    if (status) {
      filter.status = status;
    }

    const total = await prisma.order.count({ where: filter });

    const orders = await prisma.order.findMany({
      where: filter,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        totalAmount: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        items: true,
        shippingFee: true,
        discountAmount: true,
        couponCode: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    });

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    next(error);
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (
  req: any,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ["user", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Prevent downgrading the last admin
    if (role !== "admin") {
      const adminCount = await prisma.users.count({
        where: { role: "admin" },
      });
      if (adminCount === 1) {
        const targetUser = await prisma.users.findUnique({
          where: { id },
          select: { role: true },
        });
        if (targetUser?.role === "admin") {
          return res.status(400).json({
            message: "Cannot demote the last admin user",
          });
        }
      }
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: updatedUser,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    console.error("Error updating user role:", error);
    next(error);
  }
};

/**
 * Get user statistics (admin dashboard overview)
 */
export const getUserStatistics = async (
  req: any,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const totalUsers = await prisma.users.count();
    const adminUsers = await prisma.users.count({ where: { role: "admin" } });
    const regularUsers = await prisma.users.count({ where: { role: "user" } });

    // Users created in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await prisma.users.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Users created in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = await prisma.users.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        byRole: {
          admin: adminUsers,
          user: regularUsers,
        },
        newUsersThisWeek,
        newUsersThisMonth,
      },
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    next(error);
  }
};

/**
 * Bulk update user roles
 */
export const bulkUpdateUserRoles = async (
  req: any,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: "Updates must be an array" });
    }

    const results = [];

    for (const update of updates) {
      try {
        const updatedUser = await prisma.users.update({
          where: { id: update.userId },
          data: { role: update.role },
          select: {
            id: true,
            firstname: true,
            lastname: true,
            role: true,
          },
        });
        results.push({ success: true, data: updatedUser });
      } catch (error) {
        results.push({
          success: false,
          userId: update.userId,
          error: (error as any).message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk update completed",
      data: results,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    next(error);
  }
};


export const generateUserReport = async (
  req: any,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    // Check admin authorization
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { startDate, endDate, format, role } = req.query;

    // Build filter
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Add role filter
    if (role && role !== "ALL") {
      whereClause.role = role as string;
    }

    // Fetch user data
    const dbUsers = await prisma.users.findMany({
      where: whereClause,
      select: {
        firstname: true,
        lastname: true,
        email: true,
        phonenumber: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format data for reports (match order report format)
    const formattedUsers = dbUsers.map((user) => ({
      name: `${user.firstname} ${user.lastname}`,
      email: user.email,
      phone: user.phonenumber || "N/A",
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      date: new Date(user.createdAt).toLocaleDateString(),
    }));


    if (format === "EXCEL") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Users");

      // Define columns (Widths will be overwritten by auto-fit later)
      worksheet.columns = [
        { header: "Full Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 35 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Role", key: "role", width: 15 },
        { header: "Registration Date", key: "date", width: 20 },
      ];

      // Make header row bold
      worksheet.getRow(1).font = { bold: true };

      // Add all user data to the sheet
      worksheet.addRows(formattedUsers);

      // --- CONDITIONAL STYLING (Highlight Admins) ---
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip the header row

        const roleCell = row.getCell("role");

        // Make Admins bold and blue
        if (roleCell.value === "Admin" || roleCell.value === "ADMIN") {
          roleCell.font = {
            bold: true,
            color: { argb: "FF2563EB" }, 
          };
        }
      });

      // --- SUMMARY SECTION (Right-Aligned Totals) ---
      worksheet.addRow({}); 

      const summaryRow = worksheet.addRow({
        role: "Total Users:", // Put the label in the role column
        date: formattedUsers.length, // Put the count in the date column
      });

      summaryRow.font = { bold: true };
      summaryRow.getCell("role").alignment = { horizontal: "right" }; // Hug the text to the right

      
      worksheet.columns.forEach((column) => {
        if (!column) return;

        let maxLength = 0;

        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });

        column.width = maxLength < 10 ? 10 : Math.min(maxLength + 2, 50);
      });

      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.attachment("Upuls_Users_Report.xlsx");

      await workbook.xlsx.write(res);
      return res.end();
    }

    // GENERATE PDF
  
    if (format === "PDF") {
      const doc = new PDFDocument({ margin: 40 }); // Tighter margin to match Products

      res.header("Content-Type", "application/pdf");
      res.attachment("Upuls_Users_Report.pdf");

      doc.pipe(res);

      // --- CUSTOM LOGO DRAWING (Top Left) ---
      const logoX = 40;
      const logoY = 40;

      doc
        .font("Times-Bold")
        .fontSize(34)
        .fillColor("#1a1a3a")
        .text("U", logoX, logoY);
      doc
        .lineWidth(2)
        .moveTo(logoX + 26, logoY + 8)
        .lineTo(logoX + 54, logoY + 8)
        .stroke("#1a1a3a");
      doc
        .moveTo(logoX + 26, logoY + 14)
        .lineTo(logoX + 41, logoY + 14)
        .stroke("#1a1a3a");
      doc
        .font("Times-Bold")
        .fontSize(12)
        .fillColor("#dc2626")
        .text("PUL'S", logoX + 26, logoY + 19);
      doc
        .lineWidth(0.5)
        .moveTo(logoX, logoY + 36)
        .lineTo(logoX + 65, logoY + 36)
        .stroke("#d1d5db");
      doc
        .font("Helvetica-Bold")
        .fontSize(6)
        .fillColor("#6b7280")
        .text("I N T E R N A T I O N A L", logoX, logoY + 40);

      doc.fillColor("black").lineWidth(1); // Reset

      // --- PDF Header Titles (Top Right) ---
      doc.y = 50;
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("User Management Report", { align: "right" });
      doc.moveDown(1.5);

      // --- Filter Meta Data ---
      doc.fontSize(10).font("Helvetica");
      // Assuming you have startDate and endDate in your query, otherwise adjust this string
      doc.text(`Date Range: All Time`);
      doc.text(`Total Users: ${formattedUsers.length}`);
      doc.moveDown();

      // --- Column Setup ---
      // Spread across the 40 to 570 width
      const colX = {
        name: 40,
        email: 180,
        phone: 340,
        role: 440,
        date: 500,
      };

      const drawHeaders = () => {
        doc.fontSize(9).font("Helvetica-Bold");
        const headerY = doc.y;

        doc.text("Full Name", colX.name, headerY);
        doc.text("Email", colX.email, headerY);
        doc.text("Phone", colX.phone, headerY);
        doc.text("Role", colX.role, headerY);
        doc.text("Date Joined", colX.date, headerY);

        doc.y = headerY + 15;
        doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke(); // Wider line to match margin
        doc.y += 10;
        doc.font("Helvetica");
      };

      drawHeaders();

      // --- Table Rows ---
      // --- TABLE ROWS ---
      formattedUsers.forEach((user: any) => {
        let y = doc.y;

        if (y > 700) {
          doc.addPage();
          drawHeaders();
          y = doc.y;
        }

        doc.fontSize(8); // Smaller font for consistency

        // Truncate long names
        const name = user.name || "N/A";
        const shortName =
          name.length > 25 ? name.substring(0, 23) + "..." : name;
        doc.text(shortName, colX.name, y);

        // Truncate long emails
        let emailStr = user.email || "-";
        if (emailStr.includes("_deleted")) {
          emailStr = emailStr.split("_deleted")[0] + "_deleted";
        } else if (emailStr.length > 30) {
          emailStr = emailStr.substring(0, 28) + "...";
        }
        doc.text(emailStr, colX.email, y);

        let phoneStr = user.phone || "-";
        if (phoneStr.includes("_deleted")) {
          // Splits at "_deleted" and keeps just the first part + "_deleted"
          phoneStr = phoneStr.split("_deleted")[0] + "_deleted";
        } else if (phoneStr.length > 18) {
          // Safety catch for any other randomly long numbers
          phoneStr = phoneStr.substring(0, 16) + "..";
        }
        doc.text(phoneStr, colX.phone, y);

        // Make Admin roles pop in Blue!
        if (user.role === "Admin" || user.role === "ADMIN") {
          doc.fillColor("#2563eb").font("Helvetica-Bold");
          doc.text(user.role, colX.role, y);
          doc.fillColor("black").font("Helvetica"); // Reset
        } else {
          doc.text(user.role, colX.role, y);
        }

        doc.text(user.date, colX.date, y);

        doc.y = y + 20;
      });

      doc.end();
      return;
    }

    return res
      .status(400)
      .json({ message: "Invalid format. Use PDF or EXCEL" });
  } catch (error) {
    console.error("Error generating user report:", error);
    next(error);
  }
};
