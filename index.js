import * as puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';

dotenv.config();
dotenv.config({ path: '../.env' });

const { LAUNCH_URL, NUMBER_OF_ITERATIONS } = process.env;
const waitUntilEvent = { waitUntil: 'domcontentloaded' };

const generateScreenshotPath = (index) => ({ path: `screenshots/iteration-${index}/screenshot.png` });
const generateTracePath = (index) => `traces/trace-${index}.json`;

async function launchBrowser(options = {}) {
  const defaultOptions = { headless: true };
  const puppeteerOptions = { ...defaultOptions, ...options, headless: "new" };
  return await puppeteer.launch(puppeteerOptions);
}

async function iterate(index) {
  const browser = await launchBrowser();
  const [page] = await browser.pages();

  try {
    console.log(`Starting iteration ${index}`);

    // Enable tracing
    const tracePath = generateTracePath(index);
    await Promise.all([
      fs.mkdir(path.dirname(tracePath), { recursive: true }),
      page.tracing.start({ path: tracePath }),
    ]);

    console.time();
    await page.goto(LAUNCH_URL, waitUntilEvent);
    console.timeEnd();

    // Stop tracing and get the trace data
    const traceBuffer = await page.tracing.stop();
    const trace = JSON.parse(traceBuffer.toString());

    // Extract the navigation start time from the trace
    const navigationStartEvent = trace.traceEvents.find(event => event.name === 'navigationStart');

    if (navigationStartEvent) {
      const navigationStartTime = navigationStartEvent.ts / 1000; // Convert to milliseconds

      // Calculate the response time
      const responseTime = trace.traceEvents[trace.traceEvents.length - 1].ts / 1000 - navigationStartTime;

      // Save the response time to a text file
      await fs.appendFile('response_times.txt', `Iteration ${index}: ${responseTime} ms\n`);
    } else {
      console.error(`Invalid navigation start time for iteration ${index}`);
    }

    console.log(`Finished iteration ${index}`);
  } catch (error) {
    const screenshotPath = generateScreenshotPath(index);
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot(screenshotPath);
    throw new Error(error);
  } finally {
    await browser.close();
  }
}

async function clearFiles() {
  // Clear existing trace and screenshot files
  await Promise.all([
    fs.rm('traces', { recursive: true }),
    fs.rm('screenshots', { recursive: true }),
  ]);

  // Recreate the directories
  await Promise.all([
    fs.mkdir('traces', { recursive: true }),
    fs.mkdir('screenshots', { recursive: true }),
  ]);
}

async function runIterations() {
  await clearFiles();

  // Clear and create response_times.txt file
  await fs.writeFile('response_times.txt', '');

  // Run iterations concurrently
  await Promise.all(
    Array.from({ length: Number(NUMBER_OF_ITERATIONS) }, async (_, index) => {
      await iterate(index);
    })
  );

  console.log('All iterations completed.');
}

runIterations();
