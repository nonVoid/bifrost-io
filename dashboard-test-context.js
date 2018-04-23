const fs = require('fs')
const path = require('path')
const assert = require('assert')
const uuidv1 = require('uuid/v1')
const mkdirp = require('mkdirp')
const codeExcerpt = require('code-excerpt')

const generateReport = require('./generate-report')
const {sendReport, isDashboardHostConfigured} = require('./send-report')
const zipDirectory = require('./zip-directory')

const OUTPUT_BASE = './__out'
const REPORT_FILENAME = 'report.json'

const makeFileName = str => str.replace(/[^0-9a-zA-Z\- \.\(\)]/g, '')
const fileToString = fileName => fs.readFileSync(fileName).toString()
const toSeconds = num => num / 1000;
const writeReport = testContext => fs.writeFileSync(testContext.getReportFileName(), JSON.stringify(generateReport(testContext), null, 2))
const rmFileSync = filename => fs.unlinkSync(filename) 
/**
 * Collect data for a single test command
 */
class DashboardCommandContext {
    constructor(testContext, stepName, stepArgs) {
        this.testContext = testContext
        this.stepNo =  testContext.getStepNumber()
        this.name = stepName
        this.args = stepArgs
        this.pageInfo = undefined
        this.screenshot = undefined
        this.codeStack = []
    }    

    /**
     * Decide before which commands a screenshot should be taken
     */
    shouldTakeScreenshot() {
        return ['click', 'fillField', 'amOnPage'].indexOf(this.name) >= 0
    }

    /**
     * Associate a screenshot file with the current step
     */
    addScreenshot(screenshotFileName, err = undefined) {
        const moveToTestDirSync = (filename) => {
            const targetFile = path.join(this.testContext.outputPath, filename)
            fs.renameSync(path.join('.', filename), targetFile)    
            return targetFile            
        }

        const targetFile = moveToTestDirSync(screenshotFileName)

        this.screenshot = {
            shotAt: Date.now(),
            success: err !== undefined ? false : true,
            message: err && err.toString(),
            orgStack: err && err.stack,
            screenshot: screenshotFileName,
        }
        return this
    }

    /**
     * Associate a source code snippet with the command
     */
    addSourceSnippet(sourceFile, sourceLine) {
        this.codeStack.push({
            location: {
                line: sourceLine,
                file: sourceFile
            },
            source: codeExcerpt(fileToString(sourceFile), sourceLine),
        })
    }

    addPageInfo(pageInfo) {
        this.pageInfo = pageInfo
        return this
    }    

    markFailed(err) {
        this.screenshot.success = false
        this.screenshot.message = err.message
        this.screenshot.orgStack = err.stack
    }

    /**
     * Create a filename (e. g. to save a screenshot) for the current step
     */
    getFileName(ext = '.png') {
        return makeFileName(`${this.stepNo} - I.${this.name}(${this.args.join(',')}).png`)
    }
    
}

class DashboardTestContext {
    constructor(suiteTitle, testTitle) {
        this.outputPath = path.join(OUTPUT_BASE, `${suiteTitle} -- ${testTitle}`, `${Date.now()}`)
        mkdirp.sync(this.outputPath)
      
        this.result = undefined
        this.reportFileName = REPORT_FILENAME // just the filename of the report data file
        this.reportDir = this.outputPath
        this.startedAt = Date.now()
        this.duration = undefined // in seconds
        this.prefix = suiteTitle
        this.title = testTitle
        this.fullTitle = `${suiteTitle} -- ${testTitle}`

        this.commands = []
        this.deviceSettings = undefined
        this.stepCounter = 1

        this.logs = []
        this.outline = []
    }

    createCommandContext(stepName, stepArgs) {
        const cmd = new DashboardCommandContext(this, stepName, stepArgs)
        this.commands.push(cmd)
        return cmd
    }

    getStepNumber() {
        return this.stepCounter++
    }

    /**
     * Add device settings. name and type are required.
     */
    addDeviceSettings(deviceSettings) {
        assert(deviceSettings.name)
        assert(deviceSettings.type)
        this.deviceSettings = deviceSettings
    }

    /**
     * Call it when the test succeeded
     */
    markSuccessful() {
        this.result = 'success'
        this.duration = toSeconds(Date.now() - this.startedAt)
    }

    /**
     * Call it with an error instance when the test failed
     */
    markFailed(err) {
        this.result = 'error'
        this.duration = toSeconds(Date.now() - this.startedAt)

        // Update the last command (i. e. the error step) with the error
        assert(this.commands.length > 0, 'Expected commands to not be empty')
        const failedCommand = this.commands[this.commands.length - 1]
        failedCommand.markFailed(err)        
    }

    /**
     * Generate a report file name
     */
    getReportFileName(ext = '.json') {
        return path.join(this.outputPath, REPORT_FILENAME)
    }

    /**
     * Send the report and data to the dashboard service
     */
    async commit() {       
        writeReport(this);

        if (isDashboardHostConfigured()) {
            const zipFile = await zipDirectory(this.outputPath);
            try {
                await sendReport(zipFile)
            } finally {
                rmFileSync(zipFile)   
            }
        }
    }
}

module.exports = DashboardTestContext
