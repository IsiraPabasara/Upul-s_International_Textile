import { Request, Response, NextFunction } from 'express';
import prisma from '../../../../packages/libs/prisma';

// Get Announcements (Public uses this to get only active ones, Admin gets all)
export const getAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { all } = req.query;
    
    const filter = all === 'true' ? {} : { isActive: true };

    const announcements = await prisma.announcement.findMany({
      where: filter,
      orderBy: { position: 'asc' }
    });

    return res.json(announcements);
  } catch (error) {
    return next(error);
  }
};

// Create Announcement
export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, isActive, position } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: "Announcement text is required" });
    }

    const announcement = await prisma.announcement.create({
      data: { 
        text,
        isActive: isActive !== undefined ? isActive : true,
        position: position || 0
      }
    });

    return res.status(201).json(announcement);
  } catch (error) {
    return next(error);
  }
};

// Update Announcement
export const updateAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { text, isActive, position } = req.body;

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        text,
        isActive,
        position
      }
    });

    return res.status(200).json(updatedAnnouncement);
  } catch (error) {
    return next(error);
  } 
};

// Delete Announcement
export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    return res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
