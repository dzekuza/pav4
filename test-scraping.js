#!/usr/bin/env node

// Test script to verify scraping functionality with provided URLs
const testUrls = [
  "https://www.ebay.de/itm/257008999839",
  "https://www.logitechg.com/en-eu/products/gaming-keyboards/pro-x-tkl-rapid.html",
  "https://pigu.lt/lt/kompiuterine-technika/zaidimu-kompiuteriai-priedai/zaidimu-pultai/sony-dualsense-ps5-wireless-controller-v2-midnight?id=80900050",
  "https://www.varle.lt/indaploves/indaplove-indu-plovimo-masina-beko-bdfn26440xc-plienas--36343443.html",
  "https://www.amazon.de/-/en/ring-battery-video-doorbell-diy-wireless-video-doorbell-camera-with-head-to-toe-view-hd-video-easy-to-install-5-min-30-day-free-trial-of-ring-protect/dp/B0BZWQP9Z1",
];

async function testScraping() {
  console.log("Testing scraping functionality...\n");

  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`Test ${i + 1}: ${url}`);

    try {
      const response = await fetch("http://localhost:8080/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          requestId: `test-${Date.now()}-${i}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`✅ Title: ${data.originalProduct.title}`);
      console.log(
        `✅ Price: ${data.originalProduct.currency}${data.originalProduct.price}`,
      );
      console.log(`✅ Store: ${data.originalProduct.store}`);
      console.log(`✅ Alternatives found: ${data.comparisons.length}`);

      if (data.comparisons.length > 0) {
        console.log(
          `✅ First alternative: ${data.comparisons[0].store} - ${data.comparisons[0].currency}${data.comparisons[0].price}`,
        );
        console.log(
          `✅ Alternative URL type: ${data.comparisons[0].url.includes("/search") ? "Search URL ❌" : "Direct/Targeted URL ✅"}`,
        );
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log("---\n");
  }
}

// Run the test
testScraping().catch(console.error);
