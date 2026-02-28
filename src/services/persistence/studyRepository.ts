import { PrismaClient } from '@prisma/client';

export interface PortfolioStudy {
  id?: number;
  tickers: string[];
  weights: { [ticker: string]: number };
  benchmark: string;
  metrics: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
  backtest: {
    totalReturn: number;
    maxDrawdown: number;
  };
  createdAt: Date;
}

const prisma = new PrismaClient();

class StudyRepository {
  
  public async save(study: PortfolioStudy): Promise<PortfolioStudy> {
    try {
        const saved = await prisma.portfolioStudy.create({
            data: {
                tickers: study.tickers,
                weights: study.weights as any, // Prisma Json type
                benchmark: study.benchmark,
                expectedReturn: study.metrics.expectedReturn,
                volatility: study.metrics.volatility,
                sharpeRatio: study.metrics.sharpeRatio,
                backtestReturn: study.backtest.totalReturn,
                maxDrawdown: study.backtest.maxDrawdown,
                // Optional: Create snapshots if we had price data here
            }
        });
        
        console.log('Study saved to PostgreSQL:', saved.id);
        
        return {
            ...study,
            id: saved.id,
            createdAt: saved.createdAt
        };
    } catch (error) {
        console.error('Failed to save study to DB:', error);
        // Fallback to returning the input study without ID if DB fails
        return study;
    }
  }

  public async getRecent(limit: number = 5): Promise<PortfolioStudy[]> {
    try {
        const studies = await prisma.portfolioStudy.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        
        return studies.map(s => ({
            id: s.id,
            tickers: s.tickers,
            weights: s.weights as { [ticker: string]: number },
            benchmark: s.benchmark,
            metrics: {
                expectedReturn: s.expectedReturn,
                volatility: s.volatility,
                sharpeRatio: s.sharpeRatio
            },
            backtest: {
                totalReturn: s.backtestReturn,
                maxDrawdown: s.maxDrawdown
            },
            createdAt: s.createdAt
        }));
    } catch (error) {
        console.error('Failed to fetch studies from DB:', error);
        return [];
    }
  }
}

export const studyRepository = new StudyRepository();
