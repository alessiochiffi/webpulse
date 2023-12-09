# WebPulse

Using Puppeteer to measure response times and capturing traces.

## Prerequisites

- node
- Puppeteer
- .env file with configurations for url to visit and number of iterations (See `.env.example` for reference)

## Usage

```bash
npm start
This will launch Puppeteer, visit the specified URL, and measure response times for the specified number of iterations.
```

## Project Structure

- response_times.txt: File containing response times for each iteration.
- screenshots/: Directory to store screenshots if there is an error in the response.
- traces/: Directory to store trace files for each iteration.