import { Request, Response, NextFunction } from 'express';
import ImageKit from '@imagekit/nodejs';

// @ts-ignore
const imagekit = new ImageKit({
  // @ts-ignore
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

export const getAuthParams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return res.json(authenticationParameters);
  } catch (error) {
    return next(error);
  }
};