/**
 * Comprehensive Performance & Timing Logger
 * Tracks detailed timing metrics for call interactions, AI processing, and service performance
 */

class PerformanceLogger {
    constructor() {
        this.sessions = new Map(); // CallSid -> session timing data
        this.globalMetrics = {
            totalCalls: 0,
            totalTurns: 0,
            averageResponseTime: 0,
            slowestTurn: { time: 0, callSid: null, turnNumber: 0 },
            fastestTurn: { time: Infinity, callSid: null, turnNumber: 0 }
        };
        this.performanceThresholds = {
            excellent: 2000,    // < 2s
            good: 3000,         // < 3s  
            acceptable: 5000,   // < 5s
            poor: 8000,         // < 8s
            critical: 10000     // > 10s
        };
        
        // console.log(`⏱️  [PERFORMANCE LOGGER] Initialized with timing thresholds:`);
        // console.log(`   🏆 Excellent: <${this.performanceThresholds.excellent}ms`);
        // console.log(`   ✅ Good: <${this.performanceThresholds.good}ms`);
        // console.log(`   ⚠️  Acceptable: <${this.performanceThresholds.acceptable}ms`);
        // console.log(`   🐌 Poor: <${this.performanceThresholds.poor}ms`);
        // console.log(`   🚨 Critical: >${this.performanceThresholds.critical}ms`);
    }

    /**
     * Initialize session timing for a new call
     */
    initSession(callSid, callerPhone = null) {
        const sessionStart = this.getHighResTime();
        
        const session = {
            callSid,
            callerPhone,
            sessionStart,
            sessionEnd: null,
            totalDuration: 0,
            turns: [],
            currentTurn: null,
            metrics: {
                totalTurns: 0,
                averageResponseTime: 0,
                totalUserSpeechTime: 0,
                totalSilenceTime: 0,
                totalProcessingTime: 0,
                fastestTurn: Infinity,
                slowestTurn: 0,
                timeouts: 0,
                errors: 0
            },
            services: {
                llm: { totalTime: 0, calls: 0, errors: 0 },
                tts: { totalTime: 0, calls: 0, errors: 0 },
                stt: { totalTime: 0, calls: 0, errors: 0 },
                api: { totalTime: 0, calls: 0, errors: 0 }
            }
        };
        
        this.sessions.set(callSid, session);
        this.globalMetrics.totalCalls++;
        
        // console.log(`\n${"═".repeat(80)}`);
        // console.log(`⏱️  [PERFORMANCE SESSION] ${callSid} | Phone: ${callerPhone || 'Unknown'}`);
        // console.log(`🕐 Session Started: ${new Date().toLocaleString()}`);
        // console.log(`📊 High-Resolution Timer: ${sessionStart.toFixed(3)}ms`);
        // console.log(`${"═".repeat(80)}\n`);
        
        return session;
    }

    /**
     * Start timing a new turn
     */
    startTurn(callSid, turnNumber, context = {}) {
        const session = this.sessions.get(callSid);
        if (!session) {
            console.log(`❌ [PERFORMANCE] Session not found: ${callSid}`);
            return null;
        }

        const turnStart = this.getHighResTime();
        
        const turn = {
            turnNumber,
            turnStart,
            turnEnd: null,
            totalTurnTime: 0,
            context: context,
            
            // Timing phases
            phases: {
                userInput: { start: null, end: null, duration: 0 },
                aiProcessing: { start: null, end: null, duration: 0 },
                ttsGeneration: { start: null, end: null, duration: 0 },
                responseDelivery: { start: null, end: null, duration: 0 }
            },
            
            // Detailed service timings
            services: {
                stt: { start: null, end: null, duration: 0, confidence: 0, error: null },
                llm: { start: null, end: null, duration: 0, tokens: 0, cost: 0, error: null },
                tts: { start: null, end: null, duration: 0, audioSize: 0, cost: 0, error: null },
                api: { start: null, end: null, duration: 0, endpoint: null, error: null }
            },
            
            // User interaction metrics
            userMetrics: {
                speechDuration: 0,
                silenceDuration: 0,
                confidence: 0,
                transcription: '',
                retryCount: 0
            },
            
            // Performance classification
            performance: {
                grade: 'Unknown',
                bottleneck: null,
                recommendations: []
            }
        };
        
        session.currentTurn = turn;
        session.turns.push(turn);
        session.metrics.totalTurns++;
        this.globalMetrics.totalTurns++;
        
        // console.log(`🔄 [TURN ${turnNumber}] STARTED | ${callSid}`);
        // console.log(`   ⏱️  Turn Start: ${turnStart.toFixed(3)}ms`);
        // console.log(`   📍 Context: ${JSON.stringify(context)}`);
        
        return turn;
    }

    /**
     * Log STT (Speech-to-Text) timing
     */
    logSTT(callSid, startTime, endTime, transcription, confidence, error = null) {
        const session = this.sessions.get(callSid);
        if (!session?.currentTurn) return;

        const duration = endTime - startTime;
        const turn = session.currentTurn;
        
        turn.services.stt = {
            start: startTime,
            end: endTime,
            duration,
            confidence,
            error
        };
        
        turn.userMetrics.transcription = transcription || '';
        turn.userMetrics.confidence = confidence || 0;
        turn.phases.userInput.duration = duration;
        
        session.services.stt.totalTime += duration;
        session.services.stt.calls++;
        if (error) session.services.stt.errors++;
        
        // const status = error ? '❌' : '✅';
        // console.log(`🎧 [STT] ${status} Turn ${turn.turnNumber} | Duration: ${duration.toFixed(0)}ms`);
        // console.log(`   📝 Transcription: "${transcription || 'N/A'}"`);
        // console.log(`   🎯 Confidence: ${confidence ? (confidence * 100).toFixed(1) : 'N/A'}%`);
        // if (error) console.log(`   ⚠️  Error: ${error}`);
    }

    /**
     * Log LLM (AI Processing) timing
     */
    logLLM(callSid, startTime, endTime, tokens, cost, error = null) {
        const session = this.sessions.get(callSid);
        if (!session?.currentTurn) return;

        const duration = endTime - startTime;
        const turn = session.currentTurn;
        
        turn.services.llm = {
            start: startTime,
            end: endTime,
            duration,
            tokens: tokens || 0,
            cost: cost || 0,
            error
        };
        
        turn.phases.aiProcessing.start = startTime;
        turn.phases.aiProcessing.end = endTime;
        turn.phases.aiProcessing.duration = duration;
        
        session.services.llm.totalTime += duration;
        session.services.llm.calls++;
        if (error) session.services.llm.errors++;
        
        // const status = error ? '❌' : '✅';
        // console.log(`🧠 [LLM] ${status} Turn ${turn.turnNumber} | Duration: ${duration.toFixed(0)}ms`);
        // console.log(`   🎯 Tokens: ${tokens || 'N/A'} | Cost: ₹${(cost || 0).toFixed(4)}`);
        // if (error) console.log(`   ⚠️  Error: ${error}`);
    }

    /**
     * Log TTS (Text-to-Speech) timing
     */
    logTTS(callSid, startTime, endTime, audioSize, cost, service = 'Unknown', error = null) {
        const session = this.sessions.get(callSid);
        if (!session?.currentTurn) return;

        const duration = endTime - startTime;
        const turn = session.currentTurn;
        
        turn.services.tts = {
            start: startTime,
            end: endTime,
            duration,
            audioSize: audioSize || 0,
            cost: cost || 0,
            service,
            error
        };
        
        turn.phases.ttsGeneration.start = startTime;
        turn.phases.ttsGeneration.end = endTime;
        turn.phases.ttsGeneration.duration = duration;
        
        session.services.tts.totalTime += duration;
        session.services.tts.calls++;
        if (error) session.services.tts.errors++;
        
        // const status = error ? '❌' : '✅';
        // const sizeKB = audioSize ? (audioSize / 1024).toFixed(1) : 'N/A';
        // console.log(`🎤 [TTS] ${status} ${service} | Turn ${turn.turnNumber} | Duration: ${duration.toFixed(0)}ms`);
        // console.log(`   📊 Audio: ${sizeKB}KB | Cost: ₹${(cost || 0).toFixed(4)}`);
        // if (error) console.log(`   ⚠️  Error: ${error}`);
    }

    /**
     * Log API call timing
     */
    logAPI(callSid, startTime, endTime, endpoint, error = null) {
        const session = this.sessions.get(callSid);
        if (!session?.currentTurn) return;

        const duration = endTime - startTime;
        const turn = session.currentTurn;
        
        turn.services.api = {
            start: startTime,
            end: endTime,
            duration,
            endpoint: endpoint || 'Unknown',
            error
        };
        
        session.services.api.totalTime += duration;
        session.services.api.calls++;
        if (error) session.services.api.errors++;
        
        // const status = error ? '❌' : '✅';
        // console.log(`🌐 [API] ${status} ${endpoint || 'Unknown'} | Turn ${turn.turnNumber} | Duration: ${duration.toFixed(0)}ms`);
        // if (error) console.log(`   ⚠️  Error: ${error}`);
    }

    /**
     * Log user silence/timeout
     */
    logSilence(callSid, silenceDuration, reason = 'timeout') {
        const session = this.sessions.get(callSid);
        if (!session?.currentTurn) return;

        const turn = session.currentTurn;
        turn.userMetrics.silenceDuration = silenceDuration;
        session.metrics.totalSilenceTime += silenceDuration;
        
        if (reason === 'timeout') {
            session.metrics.timeouts++;
        }
        
        // console.log(`🔇 [SILENCE] Turn ${turn.turnNumber} | Duration: ${silenceDuration.toFixed(0)}ms | Reason: ${reason}`);
    }

    /**
     * Complete a turn and calculate performance metrics
     */
    completeTurn(callSid) {
        const session = this.sessions.get(callSid);
        if (!session?.currentTurn) return;

        const turn = session.currentTurn;
        const turnEnd = this.getHighResTime();
        
        turn.turnEnd = turnEnd;
        turn.totalTurnTime = turnEnd - turn.turnStart;
        
        // Calculate user wait time (processing time)
        const processingTime = turn.services.llm.duration + turn.services.tts.duration;
        session.metrics.totalProcessingTime += processingTime;
        
        // Update session metrics
        session.metrics.averageResponseTime = 
            (session.metrics.averageResponseTime * (session.metrics.totalTurns - 1) + turn.totalTurnTime) / 
            session.metrics.totalTurns;
        
        session.metrics.fastestTurn = Math.min(session.metrics.fastestTurn, turn.totalTurnTime);
        session.metrics.slowestTurn = Math.max(session.metrics.slowestTurn, turn.totalTurnTime);
        
        // Update global metrics
        if (turn.totalTurnTime < this.globalMetrics.fastestTurn.time) {
            this.globalMetrics.fastestTurn = {
                time: turn.totalTurnTime,
                callSid,
                turnNumber: turn.turnNumber
            };
        }
        
        if (turn.totalTurnTime > this.globalMetrics.slowestTurn.time) {
            this.globalMetrics.slowestTurn = {
                time: turn.totalTurnTime,
                callSid,
                turnNumber: turn.turnNumber
            };
        }
        
        // Analyze performance
        this.analyzeTurnPerformance(turn);
        
        // Log turn completion
        this.logTurnSummary(callSid, turn);
        
        session.currentTurn = null;
    }

    /**
     * Analyze turn performance and identify bottlenecks
     */
    analyzeTurnPerformance(turn) {
        const totalTime = turn.totalTurnTime;
        
        // Classify performance grade
        if (totalTime < this.performanceThresholds.excellent) {
            turn.performance.grade = 'A+';
        } else if (totalTime < this.performanceThresholds.good) {
            turn.performance.grade = 'A';
        } else if (totalTime < this.performanceThresholds.acceptable) {
            turn.performance.grade = 'B';
        } else if (totalTime < this.performanceThresholds.poor) {
            turn.performance.grade = 'C';
        } else if (totalTime < this.performanceThresholds.critical) {
            turn.performance.grade = 'D';
        } else {
            turn.performance.grade = 'F';
        }
        
        // Identify bottleneck
        const timings = {
            stt: turn.services.stt.duration,
            llm: turn.services.llm.duration,
            tts: turn.services.tts.duration,
            api: turn.services.api.duration
        };
        
        const bottleneck = Object.entries(timings).reduce((max, [service, time]) => 
            time > max.time ? { service, time } : max, 
            { service: 'unknown', time: 0 }
        );
        
        turn.performance.bottleneck = bottleneck.service;
        
        // Generate recommendations
        const recommendations = [];
        
        if (timings.llm > 3000) {
            recommendations.push('Consider optimizing AI prompt length');
        }
        if (timings.tts > 2000) {
            recommendations.push('TTS generation is slow - check service status');
        }
        if (timings.stt > 1000) {
            recommendations.push('Speech recognition delay - check audio quality');
        }
        if (totalTime > this.performanceThresholds.acceptable) {
            recommendations.push('Overall response time exceeds acceptable threshold');
        }
        
        turn.performance.recommendations = recommendations;
    }

    /**
     * Log detailed turn summary
     */
    logTurnSummary(callSid, turn) {
        const grade = turn.performance.grade;
        const gradeEmoji = {
            'A+': '🏆', 'A': '✅', 'B': '⚠️', 'C': '🐌', 'D': '🚨', 'F': '💥'
        }[grade] || '❓';
        
        console.log(`\n⏱️  [TURN ${turn.turnNumber}] COMPLETED | Grade: ${gradeEmoji} ${grade}`);
        console.log(`   📊 Total Time: ${turn.totalTurnTime.toFixed(0)}ms`);
        console.log(`   🔍 Service Breakdown:`);
        console.log(`      🎧 STT: ${turn.services.stt.duration.toFixed(0)}ms`);
        console.log(`      🧠 LLM: ${turn.services.llm.duration.toFixed(0)}ms (${turn.services.llm.tokens} tokens)`);
        console.log(`      🎤 TTS: ${turn.services.tts.duration.toFixed(0)}ms (${turn.services.tts.service || 'Unknown'})`);
        console.log(`      🌐 API: ${turn.services.api.duration.toFixed(0)}ms`);
        
        if (turn.performance.bottleneck !== 'unknown') {
            console.log(`   🎯 BOTTLENECK: ${turn.performance.bottleneck.toUpperCase()}`);
        }
        
        if (turn.performance.recommendations.length > 0) {
            console.log(`   💡 Recommendations:`);
            turn.performance.recommendations.forEach(rec => {
                console.log(`      • ${rec}`);
            });
        }
        
        console.log(`${"─".repeat(60)}\n`);
    }

    /**
     * End session and generate comprehensive report
     */
    endSession(callSid, outcome = 'completed') {
        const session = this.sessions.get(callSid);
        if (!session) return;

        const sessionEnd = this.getHighResTime();
        session.sessionEnd = sessionEnd;
        session.totalDuration = sessionEnd - session.sessionStart;
        
        console.log(`\n${"═".repeat(80)}`);
        console.log(`📊 [PERFORMANCE REPORT] ${callSid} | Outcome: ${outcome.toUpperCase()}`);
        console.log(`🕐 Total Duration: ${(session.totalDuration / 1000).toFixed(1)}s`);
        console.log(`🔄 Turns: ${session.metrics.totalTurns}`);
        console.log(`📊 Avg Response: ${session.metrics.averageResponseTime.toFixed(0)}ms`);
        console.log(`${"═".repeat(80)}`);
        
        // Performance summary
        console.log(`\n🏆 [PERFORMANCE SUMMARY]`);
        console.log(`   ⚡ Fastest Turn: ${session.metrics.fastestTurn.toFixed(0)}ms`);
        console.log(`   🐌 Slowest Turn: ${session.metrics.slowestTurn.toFixed(0)}ms`);
        console.log(`   ⏰ Total Processing: ${(session.metrics.totalProcessingTime / 1000).toFixed(1)}s`);
        console.log(`   🔇 Total Silence: ${(session.metrics.totalSilenceTime / 1000).toFixed(1)}s`);
        console.log(`   ⏱️  Timeouts: ${session.metrics.timeouts}`);
        console.log(`   ❌ Errors: ${session.metrics.errors}`);
        
        // Service breakdown with percentages
        console.log(`\n🔧 [SERVICE PERFORMANCE ANALYSIS]`);
        Object.entries(session.services).forEach(([service, metrics]) => {
            if (metrics.calls > 0) {
                const avgTime = metrics.totalTime / metrics.calls;
                const totalPercent = (metrics.totalTime / session.totalDuration * 100).toFixed(1);
                const errorRate = (metrics.errors / metrics.calls * 100).toFixed(1);
                
                console.log(`   ${service.toUpperCase()}:`);
                console.log(`      ⏱️  Avg Time: ${avgTime.toFixed(0)}ms`);
                console.log(`      📊 Total Time: ${metrics.totalTime.toFixed(0)}ms (${totalPercent}% of call)`);
                console.log(`      📞 Calls: ${metrics.calls} | ❌ Errors: ${errorRate}%`);
            }
        });
        
        console.log(`${"═".repeat(80)}\n`);
        
        // Mark session as ended
        session.outcome = outcome;
    }

    /**
     * Log real-time service performance summary
     */
    logServiceSummary(callSid) {
        const session = this.sessions.get(callSid);
        if (!session?.currentTurn) return;

        const turn = session.currentTurn;
        const services = turn.services;
        
        console.log(`\n⚡ [REAL-TIME] Turn ${turn.turnNumber} Service Performance:`);
        
        if (services.stt.duration > 0) {
            console.log(`   🎧 STT: ${services.stt.duration.toFixed(0)}ms | Confidence: ${(services.stt.confidence * 100).toFixed(1)}%`);
        }
        
        if (services.llm.duration > 0) {
            const tokensPerMs = services.llm.tokens / services.llm.duration;
            console.log(`   🧠 LLM: ${services.llm.duration.toFixed(0)}ms | ${services.llm.tokens} tokens | ${tokensPerMs.toFixed(2)} tokens/ms`);
            console.log(`        💰 Cost: ₹${services.llm.cost.toFixed(4)}`);
        }
        
        if (services.tts.duration > 0) {
            const kbPerMs = (services.tts.audioSize / 1024) / services.tts.duration;
            console.log(`   🎤 TTS: ${services.tts.duration.toFixed(0)}ms | ${(services.tts.audioSize / 1024).toFixed(1)}KB | ${kbPerMs.toFixed(2)} KB/ms`);
            console.log(`        🎵 Service: ${services.tts.service} | 💰 Cost: ₹${services.tts.cost.toFixed(4)}`);
        }
        
        if (services.api.duration > 0) {
            console.log(`   🌐 API: ${services.api.duration.toFixed(0)}ms | Endpoint: ${services.api.endpoint}`);
        }
        
        // Calculate current bottleneck
        const timings = {
            stt: services.stt.duration,
            llm: services.llm.duration,
            tts: services.tts.duration,
            api: services.api.duration
        };
        
        const bottleneck = Object.entries(timings).reduce((max, [service, time]) => 
            time > max.time ? { service, time } : max, 
            { service: 'unknown', time: 0 }
        );
        
        if (bottleneck.service !== 'unknown' && bottleneck.time > 0) {
            console.log(`   🎯 Current Bottleneck: ${bottleneck.service.toUpperCase()} (${bottleneck.time.toFixed(0)}ms)`);
        }
        
        console.log(`${"─".repeat(50)}`);
    }

    /**
     * Get high-resolution timestamp
     */
    getHighResTime() {
        return performance.now();
    }

    /**
     * Get global performance statistics
     */
    getGlobalStats() {
        return {
            ...this.globalMetrics,
            activeSessions: this.sessions.size,
            thresholds: this.performanceThresholds
        };
    }

    /**
     * Print global performance statistics
     */
    printGlobalStats() {
        const stats = this.getGlobalStats();
        
        console.log(`\n${"═".repeat(80)}`);
        console.log(`📈 [GLOBAL PERFORMANCE STATISTICS]`);
        console.log(`📞 Total Calls: ${stats.totalCalls}`);
        console.log(`🔄 Total Turns: ${stats.totalTurns}`);
        console.log(`📊 Avg Turns/Call: ${stats.totalCalls > 0 ? (stats.totalTurns / stats.totalCalls).toFixed(1) : 0}`);
        console.log(`⚡ Fastest Turn: ${stats.fastestTurn.time.toFixed(0)}ms (${stats.fastestTurn.callSid})`);
        console.log(`🐌 Slowest Turn: ${stats.slowestTurn.time.toFixed(0)}ms (${stats.slowestTurn.callSid})`);
        console.log(`🔄 Active Sessions: ${stats.activeSessions}`);
        console.log(`${"═".repeat(80)}\n`);
    }

    /**
     * Export session data for analysis
     */
    exportSessionData(callSid) {
        return this.sessions.get(callSid);
    }

    /**
     * Export all performance data
     */
    exportAllData() {
        return {
            sessions: Array.from(this.sessions.values()),
            globalMetrics: this.getGlobalStats(),
            timestamp: new Date().toISOString()
        };
    }
}

// Create singleton instance
const performanceLogger = new PerformanceLogger();

export default performanceLogger;