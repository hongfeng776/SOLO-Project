import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import recruitmentStatsService from '../services/recruitment-stats.service';
import talentMatchService from '../services/talent-match.service';

class StatsController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentStatsService.getOverviewStats();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getEfficiency(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentStatsService.getEfficiencyStats();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getStatusDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentStatsService.getStatusDistribution();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const { months } = req.query;
      const result = await recruitmentStatsService.getMonthlyTrend(Number(months) || 6);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getChannelStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentStatsService.getChannelStats();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentStatsService.getDepartmentStats();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getAllStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentStatsService.getAllStats();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getMatchScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { resumeId, jobId } = req.params;
      const result = await talentMatchService.calculateMatchScore(
        Number(resumeId),
        Number(jobId)
      );
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getMatchedResumes(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const { limit, minScore } = req.query;
      const result = await talentMatchService.getMatchedResumes(
        Number(jobId),
        Number(limit) || 20,
        Number(minScore) || 40
      );
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getMatchedJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { resumeId } = req.params;
      const { limit, minScore } = req.query;
      const result = await talentMatchService.getMatchedJobs(
        Number(resumeId),
        Number(limit) || 20,
        Number(minScore) || 40
      );
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new StatsController();
