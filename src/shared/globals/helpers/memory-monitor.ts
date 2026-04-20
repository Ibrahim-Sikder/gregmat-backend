import { config } from '@root/config';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('MemoryMonitor');

interface MemoryStats {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
    arrayBuffers: string;
    percentage: string;
}

class MemoryMonitor {
    private monitoringInterval: NodeJS.Timeout | null = null;

    /**
     * Start monitoring memory usage
     * @param intervalMinutes - Check memory every N minutes (default: 5)
     * @param warningThresholdMB - Log warning when heap used exceeds this (default: 1000MB)
     */
    public startMonitoring(intervalMinutes: number = 5, warningThresholdMB: number = 1000): void {
        if (this.monitoringInterval) {
            log.warn('Memory monitoring is already active');
            return;
        }

        log.info(
            `Starting memory monitoring: checking every ${intervalMinutes} minutes, warning threshold: ${warningThresholdMB}MB`
        );

        this.monitoringInterval = setInterval(
            () => {
                const stats = this.getMemoryStats();
                const heapUsedMB = this.parseMemoryValue(stats.heapUsed);

                if (heapUsedMB > warningThresholdMB) {
                    log.warn(`⚠️ High memory usage detected: ${JSON.stringify(stats)}`);

                    // Suggest garbage collection
                    if (global.gc) {
                        log.info('Running manual garbage collection...');
                        global.gc();
                    }
                } else {
                    log.info(`📊 Memory usage: ${JSON.stringify(stats)}`);
                }
            },
            intervalMinutes * 60 * 1000
        );
    }

    /**
     * Stop monitoring
     */
    public stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            log.info('Memory monitoring stopped');
        }
    }

    /**
     * Get current memory statistics
     */
    public getMemoryStats(): MemoryStats {
        const usage = process.memoryUsage();
        return {
            rss: this.formatBytes(usage.rss),
            heapTotal: this.formatBytes(usage.heapTotal),
            heapUsed: this.formatBytes(usage.heapUsed),
            external: this.formatBytes(usage.external),
            arrayBuffers: this.formatBytes(usage.arrayBuffers),
            percentage: `${((usage.heapUsed / usage.heapTotal) * 100).toFixed(2)}%`,
        };
    }

    /**
     * Force garbage collection if available
     */
    public forceGC(): void {
        if (global.gc) {
            log.info('Forcing garbage collection...');
            const before = process.memoryUsage().heapUsed;
            global.gc();
            const after = process.memoryUsage().heapUsed;
            const freed = this.formatBytes(before - after);
            log.info(`Garbage collection complete. Freed: ${freed}`);
        } else {
            log.warn(
                'Garbage collection not available. Run node with --expose-gc flag to enable manual GC'
            );
        }
    }

    /**
     * Log current memory usage
     */
    public logMemoryUsage(label: string = 'Current'): void {
        const stats = this.getMemoryStats();
        log.info(`${label} memory usage: ${JSON.stringify(stats)}`);
    }

    private formatBytes(bytes: number): string {
        const mb = bytes / 1024 / 1024;
        return `${mb.toFixed(2)}MB`;
    }

    private parseMemoryValue(memoryString: string): number {
        return parseFloat(memoryString.replace('MB', ''));
    }
}

export const memoryMonitor = new MemoryMonitor();
