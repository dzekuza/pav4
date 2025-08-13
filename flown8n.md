{ "nodes": [ { "parameters": { "operation": "extractHtmlContent",
"extractionValues": { "values": [ { "key": "title", "cssSelector":
"meta[property=\"og:title\"]", "returnValue": "attribute", "attribute":
"content" }, { "key": "price", "cssSelector": "[itemprop='price'], .price,
.product-price, [class*='price'], .ProductPrice-productPrice, .product__price,
.price__value, .price-final_price, .productPrice, .price-tag,
.productPrice-value, .priceValue, .price-display, .productView-price,
.product-pricing, .price__amount, .current-price, .product-detail-price" }, {
"key": "image", "cssSelector": "meta[property='og:image'],
meta[name='twitter:image'], img[src*='product'], img.main-image", "returnValue":
"attribute", "attribute": "content" } ] }, "options": {} }, "id":
"c5f124cd-5065-4817-bd59-5c8e197573e7", "name": "HTML Extract", "type":
"n8n-nodes-base.html", "typeVersion": 1.2, "position": [ 900, 1700 ],
"executeOnce": true }, { "parameters": { "url": "={{ $json.query.url }}",
"options": { "response": { "response": { "responseFormat": "text" } } } }, "id":
"ca972c92-d7c6-4344-a65e-2e8850fa2992", "name": "HTTP Request4", "type":
"n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [ 240, 1780 ],
"alwaysOutputData": false }, { "parameters": { "jsCode": "const rawTitle =
$input.first().json.title || '';\nconst cleaned = rawTitle\n
.replace(/[^\\x00-\\x7F]/g, '') // remove non-ASCII characters\n
.replace(/\\s{2,}/g, ' ') // remove double spaces\n .trim()\n .split(' ')\n
.slice(0, 6) // use only first 6 words\n .join(' ');\n\nreturn [{\n json: {\n
shortTitle: cleaned\n }\n}];" }, "type": "n8n-nodes-base.code", "typeVersion":
2, "position": [ 1560, 1775 ], "id": "b4ccce9f-86ee-48eb-a1ed-8211703f5693",
"name": "Code10" }, { "parameters": { "url":
"=https://www.searchapi.io/api/v1/search", "sendQuery": true, "queryParameters":
{ "parameters": [ { "name": "engine", "value": "google" }, { "name": "q",
"value": "={{ $json.output }}" }, { "name": "api_key", "value":
"Gegb6ekTDc86Qkw2eUk6q6fY" }, { "name": "gl", "value": "={{
$('Webhook2').first().json.query.gl }}" } ] }, "options": {} }, "type":
"n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [ 2160, 1780 ],
"id": "4c24790d-52f4-4e4b-9ad3-b2fa4537ce44", "name": "HTTP Request5" }, {
"parameters": { "jsCode": "const items = $json.organic_results || [];\n\nconst
parsed = items.slice(0, 10).map(result => {\n const title = result.title ||
'';\n const link = result.link || '';\n const domain = result.domain ||
(link.match(/^https?:\\/\\/([^/?#]+)/)?.[1] || null);\n const favicon =
result.favicon || null;\n const snippet = result.snippet || '';\n const
richSnippet = result.rich_snippet || {};\n\n let price = null;\n let
deliveryPrice = null;\n let details = richSnippet?.top?.extensions?.join(', ')
|| '';\n let stock = null;\n let merchant = result.source || domain;\n let
returnPolicy = null;\n let rating = null;\n let reviewsCount = null;\n\n // Try
to extract price from rich_snippet.extensions\n const extensions =
richSnippet?.extensions || [];\n for (const ext of extensions) {\n const text =
typeof ext === 'string' ? ext : String(ext);\n if (!price &&
text.match(/[€$]\\s?\\d{2,5}(?:[.,]\\d{2})?/)) {\n price =
text.match(/[€$]\\s?\\d{2,5}(?:[.,]\\d{2})?/)[0];\n }\n if (!deliveryPrice &&
text.toLowerCase().includes('delivery')) {\n deliveryPrice = text;\n }\n if
(!stock && /(in stock|out of stock|preorder)/i.test(text)) {\n stock = text;\n
}\n if (!returnPolicy && /(return|free returns|days return)/i.test(text)) {\n
returnPolicy = text;\n }\n if (!rating &&
text.match(/([0-5](\.\d)?)(\\s*stars?)/i)) {\n rating =
text.match(/([0-5](\.\d)?)(\\s*stars?)/i)[1];\n }\n if (!reviewsCount &&
text.match(/\\d{1,5}\\s*(ratings|reviews)/i)) {\n reviewsCount =
text.match(/\\d{1,5}/)[0];\n }\n }\n\n // Fallback: Try from snippet\n if
(!price && snippet) {\n const match =
snippet.match(/[€$]\\s?\\d{2,5}(?:[.,]\\d{2})?/);\n if (match) {\n price =
match[0];\n }\n }\n\n return {\n title,\n standardPrice: price || null,\n
discountPrice: price || null,\n deliveryPrice: deliveryPrice || null,\n details:
details || null,\n stock: stock || null,\n merchant: merchant || null,\n
returnPolicy: returnPolicy || null,\n rating: rating || null,\n reviewsCount:
reviewsCount || null,\n site: domain,\n link,\n image: favicon\n
};\n});\n\nreturn parsed.map(p => ({ json: p }));" }, "type":
"n8n-nodes-base.code", "typeVersion": 2, "position": [ 2376, 1775 ], "id":
"be47fefb-b623-4569-b86e-969b37e1ec14", "name": "Code11" }, { "parameters": {
"respondWith": "allIncomingItems", "options": {} }, "type":
"n8n-nodes-base.respondToWebhook", "typeVersion": 1.2, "position": [ 2820, 1900
], "id": "3b4bbaa8-9548-453b-97b8-e002ac73a6b2", "name": "Respond to Webhook2"
}, { "parameters": { "promptType": "define", "text": "=You are receiving product
headline {{ $json.shortTitle }} from some website. Analyze this headline and
response with real product name and product model, which can be used in google
search to find exactly same product but from different resellers. Response only
with updated product name, so it can be used for query. Do not add any other
texts, it should only include brand name and product model. Here is
example:\n\nReceived text - \"Indaplovė Indų plovimo mašina BEKO BDFN26440XC
Plienas 60 cm\" \"Best price for iPhone 16PRO MAX in Europe\"\nYour response -
\"BEKO BDFN26440XC Plienas 60 cm\" \"Iphone 16PRO MAX\"", "options": {} },
"type": "@n8n/n8n-nodes-langchain.agent", "typeVersion": 1.9, "position": [
1780, 1775 ], "id": "a4eaeb01-4c5b-4716-a190-f93b476028ae", "name": "AI Agent1"
}, { "parameters": { "modelName": "models/gemini-2.0-flash", "options": {} },
"type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini", "typeVersion": 1,
"position": [ 1868, 1995 ], "id": "d2a8b787-753e-448a-86de-256fe73bc717",
"name": "Google Gemini Chat Model3", "credentials": { "googlePalmApi": { "id":
"7yCltrB7Ab8DnVYM", "name": "Google Gemini(PaLM) Api account" } } }, {
"parameters": { "jsCode": "const chatInputUrl =
$('Webhook2').first()?.json?.query?.url || null;\n\nreturn [{\n json: {\n
mainProduct: {\n title: $items(\"HTML Extract\")[0].json.title,\n price:
$items(\"Extract Price JSON-LD1\")[0].json.price || $items(\"HTML
Extract\")[0].json.price,\n image: $items(\"HTML Extract\")[0].json.image,\n
url: chatInputUrl\n },\n suggestions: $items(\"Code11\").map(item =>
item.json)\n }\n}];" }, "type": "n8n-nodes-base.code", "typeVersion": 2,
"position": [ 2600, 1780 ], "id": "32b2c0cb-7077-4f09-b28c-870a94f8726a",
"name": "Code12" }, { "parameters": { "jsCode": "const html = $json.html ||
'';\n\nlet price = null;\n\n// 1. Extract JSON-LD manually\nconst jsonLdScripts
=
html.match(/<script[^>]_type=\"application\\/ld\\+json\"[^>]_>([\\s\\S]_?)<\\/script>/gi);\n\nif
(jsonLdScripts) {\n for (const tag of jsonLdScripts) {\n try {\n const clean =
tag.replace(/<script[^>]_>|<\\/script>/g, '');\n const json =
JSON.parse(clean);\n\n if (json?.offers?.price) {\n price = json.offers.price;\n
break;\n }\n\n if (json?.offers?.lowPrice) {\n price = json.offers.lowPrice;\n
break;\n }\n\n if (Array.isArray(json?.model)) {\n for (const model of
json.model) {\n if (model?.offers?.[0]?.price) {\n price =
model.offers[0].price;\n break;\n }\n }\n }\n } catch (err) {\n // ignore broken
JSON\n continue;\n }\n\n if (price) break;\n }\n}\n\n// 2. If price not found,
fallback to regex search\nif (!price) {\n const regex =
/(?:[\"']?price[\"']?\\s*[:=]\\s*[\"']?)([\\d.,]+)(?:[\"'])?/i;\n const match =
html.match(regex);\n if (match && match[1]) {\n price = match[1];\n
}\n}\n\n// 3. Final cleanup\nif (typeof price === 'string') {\n const clean =
price.match(/[\\d.,]+/g);\n price = clean ? clean[0] : null;\n}\n\nreturn [{
json: { price: price || null } }];" }, "type": "n8n-nodes-base.code",
"typeVersion": 2, "position": [ 460, 1700 ], "id":
"10e17575-b4b5-4178-b2cd-24d05c3f95d2", "name": "Extract Price JSON-LD1" }, {
"parameters": { "conditions": { "options": { "caseSensitive": true, "leftValue":
"", "typeValidation": "strict", "version": 2 }, "conditions": [ { "id":
"c35e2178-7df9-42f0-b800-ed067b96cd7a", "leftValue": "={{ $json.data }}",
"rightValue": "", "operator": { "type": "string", "operation": "notEmpty",
"singleValue": true } } ], "combinator": "and" }, "options": {} }, "type":
"n8n-nodes-base.if", "typeVersion": 2.2, "position": [ 680, 1775 ], "id":
"785b1ce3-a8a6-4220-a835-d28624f4ed72", "name": "If1" }, { "parameters": {},
"type": "n8n-nodes-base.merge", "typeVersion": 3.1, "position": [ 1120, 1775 ],
"id": "6fa4bf08-881f-455d-bc27-82200d382190", "name": "Merge4" }, {
"parameters": { "jsCode": "const [productData, priceData] =
$input.all().map(item => item.json);\n\nconst final = {\n title:
productData.title,\n image: productData.image,\n price: productData.price ||
priceData.price || null\n};\n\nreturn [{ json: final }];" }, "type":
"n8n-nodes-base.code", "typeVersion": 2, "position": [ 1340, 1775 ], "id":
"fb14c669-674f-4769-85d8-9e5549b01d09", "name": "Code13" }, { "parameters": {
"conditions": { "options": { "caseSensitive": true, "leftValue": "",
"typeValidation": "strict", "version": 2 }, "conditions": [ { "id":
"e9e37b62-21e8-4058-95d0-1e2f194b2fb1", "leftValue": "={{ $json.query.url }}",
"rightValue": "http", "operator": { "type": "string", "operation": "contains" }
} ], "combinator": "and" }, "options": {} }, "type": "n8n-nodes-base.if",
"typeVersion": 2.2, "position": [ 20, 1900 ], "id":
"09f81ccc-e219-4cd4-8684-90427ff516ff", "name": "If" }, { "parameters": { "url":
"=https://www.searchapi.io/api/v1/search", "sendQuery": true, "queryParameters":
{ "parameters": [ { "name": "engine", "value": "google" }, { "name": "q",
"value": "={{ $json.query.url }}" }, { "name": "api_key", "value":
"Gegb6ekTDc86Qkw2eUk6q6fY" }, { "name": "gl", "value": "={{
$('Webhook2').first().json.query.gl }}" } ] }, "options": {} }, "type":
"n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [ 2380, 2020 ],
"id": "2c282938-2b02-4cf9-8c2e-e228b1f3fac3", "name": "HTTP Request" }, {
"parameters": { "jsCode": "// Extract and format product suggestion data from
SearchAPI.io response\nconst results = $json.organic_results || [];\n\nconst
suggestions = results.slice(0, 10).map(result => {\n const title = result.title
|| '';\n const link = result.link || '';\n const domain = result.domain ||
(link.match(/^https?:\\/\\/([^/?#]+)/)?.[1] || null);\n const favicon =
result.favicon || null;\n const snippet = result.snippet || '';\n const
richSnippet = result.rich_snippet || {};\n\n let price = null;\n let
deliveryPrice = null;\n let details = richSnippet?.top?.extensions?.join(', ')
|| '';\n let stock = null;\n let merchant = result.source || domain;\n let
returnPolicy = null;\n let rating = null;\n let reviewsCount = null;\n\n const
extensions = richSnippet?.extensions || [];\n for (const ext of extensions) {\n
const text = typeof ext === 'string' ? ext : String(ext);\n\n if (!price &&
text.match(/[€$]\\s?\\d{2,5}(?:[.,]\\d{2})?/)) {\n price =
text.match(/[€$]\\s?\\d{2,5}(?:[.,]\\d{2})?/)[0];\n }\n if (!deliveryPrice &&
text.toLowerCase().includes('delivery')) {\n deliveryPrice = text;\n }\n if
(!stock && /(in stock|out of stock|preorder)/i.test(text)) {\n stock = text;\n
}\n if (!returnPolicy && /(return|free returns|days return)/i.test(text)) {\n
returnPolicy = text;\n }\n if (!rating &&
text.match(/([0-5](\.\d)?)(\\s*stars?)/i)) {\n rating =
text.match(/([0-5](\.\d)?)(\\s*stars?)/i)[1];\n }\n if (!reviewsCount &&
text.match(/\\d{1,5}\\s*(ratings|reviews)/i)) {\n reviewsCount =
text.match(/\\d{1,5}/)[0];\n }\n }\n\n if (!price && snippet) {\n const match =
snippet.match(/[€$]\\s?\\d{2,5}(?:[.,]\\d{2})?/);\n if (match) {\n price =
match[0];\n }\n }\n\n return {\n title,\n standardPrice: price,\n discountPrice:
price,\n deliveryPrice,\n details,\n stock,\n merchant,\n returnPolicy,\n
rating,\n reviewsCount,\n site: domain,\n link,\n image: favicon\n
};\n});\n\nreturn suggestions.map(suggestion => ({ json: suggestion }));" },
"type": "n8n-nodes-base.code", "typeVersion": 2, "position": [ 2596, 2025 ],
"id": "4d10c080-7b08-4348-af51-2a44e024e345", "name": "Code" }, { "parameters":
{ "path": "new-test", "responseMode": "responseNode", "options": {} }, "type":
"n8n-nodes-base.webhook", "typeVersion": 2, "position": [ -200, 1900 ], "id":
"2c165fbf-f675-454c-a18d-129a2d468c36", "name": "Webhook2", "webhookId":
"1dd5f11f-d315-4eff-b672-a4b5d3ecbebc" } ], "connections": { "HTML Extract": {
"main": [ [ { "node": "Merge4", "type": "main", "index": 0 } ] ] }, "HTTP
Request4": { "main": [ [ { "node": "Extract Price JSON-LD1", "type": "main",
"index": 0 }, { "node": "If1", "type": "main", "index": 0 } ] ] }, "Code10": {
"main": [ [ { "node": "AI Agent1", "type": "main", "index": 0 } ] ] }, "HTTP
Request5": { "main": [ [ { "node": "Code11", "type": "main", "index": 0 } ] ] },
"Code11": { "main": [ [ { "node": "Code12", "type": "main", "index": 0 } ] ] },
"AI Agent1": { "main": [ [ { "node": "HTTP Request5", "type": "main", "index": 0
} ] ] }, "Google Gemini Chat Model3": { "ai_languageModel": [ [ { "node": "AI
Agent1", "type": "ai_languageModel", "index": 0 } ] ] }, "Code12": { "main": [ [
{ "node": "Respond to Webhook2", "type": "main", "index": 0 } ] ] }, "Extract
Price JSON-LD1": { "main": [ [ { "node": "If1", "type": "main", "index": 0 } ] ]
}, "If1": { "main": [ [ { "node": "HTML Extract", "type": "main", "index": 0 }
], [ { "node": "Merge4", "type": "main", "index": 1 } ] ] }, "Merge4": { "main":
[ [ { "node": "Code13", "type": "main", "index": 0 } ] ] }, "Code13": { "main":
[ [ { "node": "Code10", "type": "main", "index": 0 } ] ] }, "If": { "main": [ [
{ "node": "HTTP Request4", "type": "main", "index": 0 } ], [ { "node": "HTTP
Request", "type": "main", "index": 0 } ] ] }, "HTTP Request": { "main": [ [ {
"node": "Code", "type": "main", "index": 0 } ] ] }, "Code": { "main": [ [ {
"node": "Respond to Webhook2", "type": "main", "index": 0 } ] ] }, "Webhook2": {
"main": [ [ { "node": "If", "type": "main", "index": 0 } ] ] } }, "pinData": {},
"meta": { "templateCredsSetupCompleted": true, "instanceId":
"af87dc7f54b33887d7e9f5adfb1f78aafa4624598c4ec22c6564c704f64885e2" } }
