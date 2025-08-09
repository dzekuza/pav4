import{j as e,C as n,B as F,y as B,I as M,J as I,E as R,x as E,A as Y,r as W}from"./vendor_ui-DPKP3YLX.js";import{r as o}from"./vendor_react-Bpl_dUPQ.js";import{B as m}from"./button-BVbCSO_a.js";import{C as f,a as b,b as j,c as v,d as N}from"./card-C3AOPTFZ.js";import{L as P}from"./label-09uxue2U.js";import{u as q}from"./index-Bm7-4qCY.js";import{d as V}from"./vendor_router-0FUT4RNd.js";function ee(){const{stats:t}=V(),{toast:c}=q(),[a,k]=o.useState(1),[s,u]=o.useState(null),[x,_]=o.useState(!1),[h,y]=o.useState([]),[A,T]=o.useState(!1);o.useEffect(()=>()=>{window.__ph_pollInterval&&clearInterval(window.__ph_pollInterval),window.__ph_stopTimeout&&clearTimeout(window.__ph_stopTimeout)},[]),o.useEffect(()=>{if(t!=null&&t.domain&&!s){const i=t.domain.toLowerCase();i.includes("shopify")||i.includes("myshopify.com")?u(p.find(r=>r.id==="shopify")||null):i.includes("woocommerce")||i.includes("wordpress")?u(p.find(r=>r.id==="woocommerce")||null):i.includes("magento")&&u(p.find(r=>r.id==="magento")||null)}},[t==null?void 0:t.domain,s]);const p=[{id:"shopify",name:"Shopify",description:"E-commerce platform for online stores",icon:"🛍️",features:["Product tracking","Purchase tracking","Cart tracking","User behavior"],get scriptTemplate(){return`<!-- PriceHunt Shopify Integration -->
<script src="https://paaav.vercel.app/shopify-tracker.js" data-business-id="${(t==null?void 0:t.id)||"YOUR_BUSINESS_ID"}" data-affiliate-id="${(t==null?void 0:t.affiliateId)||"YOUR_AFFILIATE_ID"}"><\/script>
<script>
// Shopify-specific tracking
document.addEventListener('DOMContentLoaded', function() {
  // Track product page views
  if (window.Shopify && window.Shopify.theme) {
    const product = window.Shopify.theme.product;
    if (product) {
      window.PriceHuntTracker.track('product_view', {
        product_id: product.id,
        product_name: product.title,
        product_price: product.price
      });
    }
  }
  
  // Track add to cart
  document.addEventListener('click', function(e) {
    if (e.target.matches('[data-action="add-to-cart"], .add-to-cart, [class*="cart"]')) {
      window.PriceHuntTracker.track('add_to_cart', {
        product_id: e.target.getAttribute('data-product-id'),
        product_name: e.target.getAttribute('data-product-name')
      });
    }
  });
});
<\/script>
<!-- End PriceHunt Shopify Integration -->`}},{id:"woocommerce",name:"WooCommerce",description:"WordPress e-commerce plugin",icon:"🛒",features:["Product tracking","Purchase tracking","Cart tracking","User behavior"],get scriptTemplate(){return`<!-- PriceHunt WooCommerce Integration -->
<script src="https://paaav.vercel.app/woocommerce-tracker.js" data-business-id="${(t==null?void 0:t.id)||"YOUR_BUSINESS_ID"}" data-affiliate-id="${(t==null?void 0:t.affiliateId)||"YOUR_AFFILIATE_ID"}"><\/script>
<script>
// WooCommerce-specific tracking
document.addEventListener('DOMContentLoaded', function() {
  // Track product page views
  if (document.querySelector('.woocommerce div.product')) {
    const productName = document.querySelector('.product_title')?.textContent;
    const productPrice = document.querySelector('.price .amount')?.textContent;
    
    window.PriceHuntTracker.track('product_view', {
      product_name: productName,
      product_price: productPrice
    });
  }
  
  // Track add to cart
  document.addEventListener('click', function(e) {
    if (e.target.matches('.single_add_to_cart_button, .add_to_cart_button')) {
      const productName = document.querySelector('.product_title')?.textContent;
      window.PriceHuntTracker.track('add_to_cart', {
        product_name: productName
      });
    }
  });
});
<\/script>
<!-- End PriceHunt WooCommerce Integration -->`}},{id:"magento",name:"Magento",description:"Enterprise e-commerce platform",icon:"🏢",features:["Product tracking","Purchase tracking","Cart tracking","User behavior"],get scriptTemplate(){return`<!-- PriceHunt Magento Integration -->
<script src="https://paaav.vercel.app/magento-tracker.js" data-business-id="${(t==null?void 0:t.id)||"YOUR_BUSINESS_ID"}" data-affiliate-id="${(t==null?void 0:t.affiliateId)||"YOUR_AFFILIATE_ID"}"><\/script>
<script>
// Magento-specific tracking
document.addEventListener('DOMContentLoaded', function() {
  // Track product page views
  if (document.querySelector('.product-info')) {
    const productName = document.querySelector('.page-title')?.textContent;
    const productPrice = document.querySelector('.price')?.textContent;
    
    window.PriceHuntTracker.track('product_view', {
      product_name: productName,
      product_price: productPrice
    });
  }
  
  // Track add to cart
  document.addEventListener('click', function(e) {
    if (e.target.matches('#product-addtocart-button, .add-to-cart')) {
      const productName = document.querySelector('.page-title')?.textContent;
      window.PriceHuntTracker.track('add_to_cart', {
        product_name: productName
      });
    }
  });
});
<\/script>
<!-- End PriceHunt Magento Integration -->`}},{id:"custom",name:"Custom Website",description:"Any website with custom tracking",icon:"🌐",features:["Basic tracking","Page views","User behavior","Custom events"],get scriptTemplate(){return`<!-- PriceHunt Custom Integration -->
<script src="https://paaav.vercel.app/tracker.js" data-business-id="${(t==null?void 0:t.id)||"YOUR_BUSINESS_ID"}" data-affiliate-id="${(t==null?void 0:t.affiliateId)||"YOUR_AFFILIATE_ID"}"><\/script>
<script>
// Custom website tracking
document.addEventListener('DOMContentLoaded', function() {
  // Track page views
  window.PriceHuntTracker.track('page_view', {
    page_url: window.location.href,
    page_title: document.title
  });
  
  // Track product clicks (customize selectors for your site)
  document.addEventListener('click', function(e) {
    if (e.target.matches('.product-link, .buy-button, [data-product]')) {
      const productName = e.target.getAttribute('data-product-name') || e.target.textContent;
      window.PriceHuntTracker.track('product_click', {
        product_name: productName
      });
    }
  });
});
<\/script>
<!-- End PriceHunt Custom Integration -->`}}],L=async i=>{try{await navigator.clipboard.writeText(i),T(!0),c({title:"Script Copied!",description:"Tracking script has been copied to clipboard"}),setTimeout(()=>T(!1),2e3)}catch{c({title:"Error",description:"Failed to copy script to clipboard",variant:"destructive"})}},C=async()=>{if(!(t!=null&&t.domain)){c({title:"Error",description:"No website domain found. Please check your business registration.",variant:"destructive"});return}_(!0),y([]),window.__ph_pollInterval&&clearInterval(window.__ph_pollInterval),window.__ph_stopTimeout&&clearTimeout(window.__ph_stopTimeout);const i=setInterval(async()=>{try{const l=await fetch(`/api/tracking-events${t!=null&&t.id?`?business_id=${t.id}`:""}`,{credentials:"include"});if(l.ok){const w=await l.json();if(w.success&&w.events.length>0){const U=w.events.map(g=>({timestamp:g.timestamp,event:g.eventType,details:`Event from ${g.url||"unknown page"}`,status:"success"}));y(U)}}}catch(l){console.error("Error fetching tracking events:",l)}},4e3);window.__ph_pollInterval=i;const r=setTimeout(()=>{clearInterval(i),window.__ph_pollInterval=void 0,_(!1),h.length===0?c({title:"No Events Detected",description:"No tracking events were detected. Make sure the tracking script is installed on your website.",variant:"destructive"}):c({title:"Testing Complete!",description:`Detected ${h.length} tracking events from your website.`})},3e4);window.__ph_stopTimeout=r},D=async()=>{try{const i=await fetch("/api/test-tracking",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({business_id:t==null?void 0:t.id})});if(i.ok){const r=await i.json();c({title:"Test Events Created",description:r.message||"Test tracking events have been created successfully."}),C()}else c({title:"Error",description:"Failed to create test events. Please try again.",variant:"destructive"})}catch(i){console.error("Error generating test events:",i),c({title:"Error",description:"Failed to create test events. Please try again.",variant:"destructive"})}},H=()=>{if(t!=null&&t.domain){const i=t.domain.startsWith("http")?t.domain:`https://${t.domain}`;window.open(i,"_blank")}},d=i=>i<a?"completed":i===a?"current":"pending",S=()=>{switch(a){case 1:return s!==null;case 2:return!0;case 3:return!0;default:return!1}},O=()=>{S()&&k(i=>Math.min(i+1,3))},$=()=>{k(i=>Math.max(i-1,1))};return e.jsxs("div",{className:"space-y-6 text-white",children:[e.jsx("div",{className:"flex items-center justify-between mb-8",children:e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-white",children:"Integration Setup"}),e.jsx("p",{className:"text-white/70",children:"Set up tracking for your website in 3 simple steps"})]})}),e.jsx("div",{className:"flex items-center justify-between mb-8",children:[1,2,3].map(i=>e.jsxs("div",{className:"flex items-center",children:[e.jsx("div",{className:`w-8 h-8 rounded-full flex items-center justify-center ${d(i)==="completed"?"bg-green-500 text-black":d(i)==="current"?"bg-white text-black":"bg-white/10 text-white/60"}`,children:d(i)==="completed"?e.jsx(n,{className:"h-4 w-4"}):e.jsx("span",{className:"text-sm font-medium",children:i})}),e.jsx("span",{className:`ml-2 text-sm font-medium ${d(i)==="current"?"text-white":d(i)==="completed"?"text-green-400":"text-white/60"}`,children:i===1?"Choose Platform":i===2?"Add Script":"Test Tracking"}),i<3&&e.jsx("div",{className:`w-16 h-0.5 mx-4 ${d(i+1)==="completed"?"bg-green-500":"bg-white/20"}`})]},i))}),a===1&&e.jsxs(f,{className:"border-white/10 bg-white/5",children:[e.jsxs(b,{children:[e.jsxs(j,{className:"flex items-center gap-2 text-white",children:[e.jsx(F,{className:"h-5 w-5"}),"Choose Your Platform"]}),e.jsx(v,{className:"text-white/80",children:"Select the platform your website is built on to get the appropriate tracking script"})]}),e.jsx(N,{children:e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:p.map(i=>e.jsx("div",{className:`p-4 border rounded-lg cursor-pointer transition-all ${(s==null?void 0:s.id)===i.id?"border-white bg-white/10":"border-white/10 hover:border-white/20 bg-white/5"}`,onClick:()=>u(i),children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"text-2xl",children:i.icon}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-semibold text-white",children:i.name}),e.jsx("p",{className:"text-sm text-white/70 mb-2",children:i.description}),e.jsx("div",{className:"space-y-1",children:i.features.map((r,l)=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(n,{className:"h-3 w-3 text-green-400"}),e.jsx("span",{className:"text-xs text-white/70",children:r})]},l))})]}),(s==null?void 0:s.id)===i.id&&e.jsx(n,{className:"h-5 w-5 text-white"})]})},i.id))})})]}),a===2&&e.jsxs(f,{className:"border-white/10 bg-white/5",children:[e.jsxs(b,{children:[e.jsxs(j,{className:"flex items-center gap-2 text-white",children:[e.jsx(B,{className:"h-5 w-5"}),"Add Tracking Script"]}),e.jsx(v,{className:"text-white/80",children:"Copy the tracking script and add it to your website"})]}),e.jsxs(N,{className:"space-y-4",children:[e.jsxs("div",{className:"border border-white/10 bg-white/5 rounded-lg p-4",children:[e.jsx("h4",{className:"font-medium text-white mb-2",children:"📋 Your Business Information:"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-medium text-white",children:"Business Name:"})," ",t==null?void 0:t.name]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium text-white",children:"Website:"})," ",t==null?void 0:t.domain]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium text-white",children:"Business ID:"})," ",t==null?void 0:t.id]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium text-white",children:"Affiliate ID:"})," ",t==null?void 0:t.affiliateId]})]})]}),s&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("h4",{className:"font-medium text-white",children:["Tracking Script for ",s.name]}),e.jsxs(m,{size:"sm",onClick:()=>L(s.scriptTemplate),className:"rounded-full bg-white text-black border border-black/10 hover:bg-white/90",children:[e.jsx(M,{className:"h-4 w-4 mr-2"}),A?"Copied!":"Copy Script"]})]}),e.jsx("div",{className:"bg-black/40 border border-white/10 rounded-lg p-4 text-white",children:e.jsx("pre",{className:"text-xs overflow-x-auto",children:e.jsx("code",{children:s.scriptTemplate})})}),e.jsxs("div",{className:"border border-white/10 bg-white/5 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-white mb-2",children:"✅ Installation Instructions:"}),e.jsxs("ol",{className:"text-sm text-white/80 space-y-1",children:[e.jsx("li",{children:"1. Copy the script above"}),e.jsx("li",{children:"2. Add it to your website's <head> section"}),e.jsx("li",{children:"3. For Shopify: Add to theme.liquid file in your theme"}),e.jsx("li",{children:"4. For WooCommerce: Add to header.php or use a plugin"}),e.jsx("li",{children:"5. For Magento: Add to default_head_blocks.xml"}),e.jsx("li",{children:"6. For Custom: Add to your main HTML template"})]})]}),e.jsxs("div",{className:"border border-white/10 bg-white/5 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-white mb-2",children:"⚠️ Important Notes:"}),e.jsxs("ul",{className:"text-sm text-white/80 space-y-1",children:[e.jsx("li",{children:"• The script will only track users who came from our app"}),e.jsx("li",{children:"• It tracks product views, cart additions, and purchases"}),e.jsx("li",{children:"• Make sure to test the script after installation"}),e.jsx("li",{children:"• Contact support if you need help with installation"})]})]})]})]})]}),a===3&&e.jsxs(f,{className:"border-white/10 bg-white/5",children:[e.jsxs(b,{children:[e.jsxs(j,{className:"flex items-center gap-2 text-white",children:[e.jsx(I,{className:"h-5 w-5"}),"Test Your Tracking"]}),e.jsx(v,{className:"text-white/80",children:"Verify that tracking is working correctly on your website"})]}),e.jsxs(N,{className:"space-y-4",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx(P,{children:"Test Your Website"}),e.jsx("p",{className:"text-sm text-white/70 mb-2",children:"Open your website to test the tracking script"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(m,{onClick:H,disabled:!(t!=null&&t.domain),className:"rounded-full bg-white text-black border border-black/10 hover:bg-white/90",children:[e.jsx(R,{className:"h-4 w-4 mr-2"}),"Open ",t==null?void 0:t.domain]}),e.jsxs(m,{variant:"outline",onClick:C,disabled:x||!(t!=null&&t.domain),className:"rounded-full bg-white text-black border border-black/10 hover:bg-white/90",children:[e.jsx(I,{className:"h-4 w-4 mr-2"}),x?"Testing...":"Start Test"]}),e.jsxs(m,{variant:"secondary",onClick:D,disabled:x,className:"rounded-full bg-white text-black border border-black/10 hover:bg-white/90",children:[e.jsx(E,{className:"h-4 w-4 mr-2"}),"Generate Test Events"]})]})]}),e.jsxs("div",{className:"border border-white/10 bg-white/5 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-white mb-2",children:"⚠️ Testing Instructions:"}),e.jsxs("ul",{className:"text-sm text-white/80 space-y-1",children:[e.jsx("li",{children:"• Open your website in a new tab"}),e.jsx("li",{children:"• Browse through different pages"}),e.jsx("li",{children:"• View product pages"}),e.jsx("li",{children:"• Add items to cart"}),e.jsx("li",{children:"• Complete a test purchase"}),e.jsx("li",{children:"• Return here to see tracking results"})]})]})]}),e.jsxs("div",{children:[e.jsx(P,{children:"Tracking Events"}),e.jsx("p",{className:"text-sm text-white/70 mb-2",children:"Real-time tracking events from your website"}),e.jsx("div",{className:"space-y-2 max-h-64 overflow-y-auto",children:h.length===0?e.jsxs("div",{className:"text-center py-8 text-white/70",children:[e.jsx(E,{className:"h-8 w-8 mx-auto mb-2 text-white/50"}),e.jsx("p",{children:"No tracking events yet"}),e.jsx("p",{className:"text-xs",children:"Start testing to see events here"})]}):h.map((i,r)=>e.jsxs("div",{className:"flex items-center gap-3 p-3 border rounded-lg border-white/10 bg-white/5",children:[e.jsx("div",{className:`w-2 h-2 rounded-full ${i.status==="success"?"bg-green-400":i.status==="error"?"bg-red-400":"bg-yellow-400"}`}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:"font-medium text-sm text-white",children:i.event}),e.jsx("div",{className:"text-xs text-white/70",children:i.details})]}),e.jsx("div",{className:"text-xs text-white/60",children:new Date(i.timestamp).toLocaleTimeString()})]},r))})]})]}),h.length>0&&e.jsxs("div",{className:"border border-white/10 bg-white/5 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-white mb-2",children:"✅ Tracking Status:"}),e.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/80",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(n,{className:"h-4 w-4 text-green-400"}),e.jsx("span",{children:"Script Loaded"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(n,{className:"h-4 w-4 text-green-400"}),e.jsx("span",{children:"User Tracking"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(n,{className:"h-4 w-4 text-green-400"}),e.jsx("span",{children:"Product Views"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(n,{className:"h-4 w-4 text-green-400"}),e.jsx("span",{children:"Purchase Tracking"})]})]})]})]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsxs(m,{variant:"outline",onClick:$,disabled:a===1,className:"rounded-full bg-white text-black border border-black/10 hover:bg-white/90",children:[e.jsx(Y,{className:"h-4 w-4 mr-2"}),"Previous"]}),e.jsxs(m,{onClick:O,disabled:!S(),className:"rounded-full bg-white text-black border border-black/10 hover:bg-white/90",children:[a===3?"Finish Setup":"Next Step",e.jsx(W,{className:"h-4 w-4 ml-2"})]})]})]})}export{ee as default};
