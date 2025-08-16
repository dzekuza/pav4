import { Request, Response } from "express";

export const handleDemo = async (req: Request, res: Response) => {
  try {
    res.json({
      message: "Demo endpoint working",
      timestamp: new Date().toISOString(),
      status: "success",
    });
  } catch (error) {
    console.error("Demo handler error:", error);
    res.status(500).json({
      message: "Demo endpoint error",
      status: "error",
    });
  }
};
