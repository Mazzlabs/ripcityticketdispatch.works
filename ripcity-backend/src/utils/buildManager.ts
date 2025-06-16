/**
 * Build Manager - Utilities for managing React builds from Node.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from './logger';

const execAsync = promisify(exec);

export class BuildManager {
  private readonly reactAppPath: string;

  constructor() {
    this.reactAppPath = path.resolve(__dirname, '../../../rip-city-tickets-react');
  }

  /**
   * Trigger a React build
   */
  async buildReactApp(): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      logger.info('Starting React app build...');
      
      const { stdout, stderr } = await execAsync('npm ci && npm run build', {
        cwd: this.reactAppPath,
        timeout: 300000 // 5 minutes timeout
      });

      logger.info('React app build completed successfully');
      return {
        success: true,
        output: stdout
      };
    } catch (error: any) {
      logger.error('React app build failed:', error);
      return {
        success: false,
        error: error.message,
        output: error.stdout
      };
    }
  }

  /**
   * Check if React build exists and is recent
   */
  async isBuildFresh(maxAgeMinutes: number = 60): Promise<boolean> {
    try {
      const buildPath = path.join(this.reactAppPath, 'build', 'index.html');
      const fs = await import('fs');
      const stats = await fs.promises.stat(buildPath);
      const ageMs = Date.now() - stats.mtime.getTime();
      const ageMinutes = ageMs / (1000 * 60);
      
      return ageMinutes <= maxAgeMinutes;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build React app if needed (not fresh)
   */
  async buildIfNeeded(maxAgeMinutes: number = 60): Promise<boolean> {
    const isFresh = await this.isBuildFresh(maxAgeMinutes);
    
    if (isFresh) {
      logger.info('React build is fresh, skipping build');
      return true;
    }

    logger.info('React build is stale, triggering new build');
    const result = await this.buildReactApp();
    return result.success;
  }
}

export const buildManager = new BuildManager();
export default buildManager;
