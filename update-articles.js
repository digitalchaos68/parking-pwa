// update-articles.js
const fs = require('fs');
const path = require('path');

// === 1. Define Categories & Articles ===
const categories = {
  'parking-basics': {
    name: 'Parking Basics',
    id: 'parking-basics'
  },
  'future-tech': {
    name: 'The Future of Parking & Technology',
    id: 'future-tech'
  },
  'legal-financial': {
    name: 'Legal & Financial Aspects of Parking',
    id: 'legal-financial'
  },
  'urban-planning': {
    name: 'Urban Planning & Infrastructure',
    id: 'urban-planning'
  },
  'safety-security': {
    name: 'Safety, Security & Emergency Preparedness',
    id: 'safety-security'
  }
};

// === 2. Define All Articles with Metadata ===
const articles = [
  // Category 1: Parking Basics
  { file: 'parallel-park.html', title: 'How to Parallel Park Like a Pro', category: 'parking-basics' },
  { file: 'parking-meters.html', title: 'A Beginner’s Guide to Parking Meters', category: 'parking-basics' },
  { file: 'handicap-parking.html', title: 'Understanding Handicap Parking Rules', category: 'parking-basics' },
  { file: 'residential-permits.html', title: 'What Are Residential Parking Permits?', category: 'parking-basics' },
  { file: 'time-limits.html', title: 'How to Handle Parking Time Limits', category: 'parking-basics' },
  { file: 'fire-hydrants.html', title: 'Parking Near Fire Hydrants: What You Need to Know', category: 'parking-basics' },
  { file: 'tow-away-zones.html', title: 'Avoiding Tow-Away Zones: A Complete Guide', category: 'parking-basics' },
  { file: 'parking-signs.html', title: 'Decoding Common Parking Signs and Their Meanings', category: 'parking-basics' },
  { file: 'avoid-tickets.html', title: 'How to Avoid Parking Tickets and Fines', category: 'parking-basics' },
  { file: 'meter-extensions.html', title: 'Can You Extend Your Parking Meter Time?', category: 'parking-basics' },

  // Category 2: Future of Parking & Technology
  { file: 'parking-apps.html', title: 'Top Parking Apps to Save Time and Money', category: 'future-tech' },
  { file: 'smart-parking.html', title: 'What Is Smart Parking and How Does It Work?', category: 'future-tech' },
  { file: 'robotic-parking.html', title: 'Robotic Parking Systems: The Future of Urban Parking', category: 'future-tech' },
  { file: 'ai-parking.html', title: 'How AI and Machine Learning Are Changing Parking', category: 'future-tech' },
  { file: 'self-parking-cars.html', title: 'Self-Parking Cars: Are They the Future?', category: 'future-tech' },
  { file: 'ev-parking.html', title: 'Electric Vehicle Charging and Parking: What You Need to Know', category: 'future-tech' },
  { file: 'contactless-payments.html', title: 'Contactless Payments: A New Era for Parking', category: 'future-tech' },
  { file: 'geolocation.html', title: 'Using Geolocation for Real-Time Parking Availability', category: 'future-tech' },
  { file: 'pwa-benefits.html', title: 'How PWA Technology Benefits Your Parking App', category: 'future-tech' },
  { file: 'evolution.html', title: 'The Evolution of Parking from Meters to Mobile Apps', category: 'future-tech' },

  // Category 3: Legal & Financial
  { file: 'parking-tickets.html', title: 'A Driver\'s Guide to Parking Tickets and Fines', category: 'legal-financial' },
  { file: 'dispute-ticket.html', title: 'How to Dispute a Parking Ticket', category: 'legal-financial' },
  { file: 'parking-laws.html', title: 'Understanding Parking Laws and Regulations', category: 'legal-financial' },
  { file: 'urban-cost.html', title: 'What is the Cost of Urban Parking?', category: 'legal-financial' },
  { file: 'pay-smart.html', title: 'How to Pay for Parking the Smart Way', category: 'legal-financial' },
  { file: 'public-vs-private.html', title: 'The Difference Between Public and Private Parking Lots', category: 'legal-financial' },
  { file: 'hidden-costs.html', title: 'Navigating Parking Fees and Hidden Costs', category: 'legal-financial' },
  { file: 'lot-rights.html', title: 'Your Rights and Responsibilities in a Parking Lot', category: 'legal-financial' },
  { file: 'towing-legal.html', title: 'The Legal Side of Towing: What You Need to Know', category: 'legal-financial' },
  { file: 'future-enforcement.html', title: 'The Future of Parking Enforcement', category: 'legal-financial' },

  // Category 4: Urban Planning
  { file: 'solving-parking.html', title: 'How Cities Are Solving the Parking Problem', category: 'urban-planning' },
  { file: 'urban-development.html', title: 'The Role of Parking in Urban Development', category: 'urban-planning' },
  { file: 'sustainable-solutions.html', title: 'Sustainable Parking Solutions for a Greener City', category: 'urban-planning' },
  { file: 'traffic-congestion.html', title: 'How Parking Affects Traffic Congestion', category: 'urban-planning' },
  { file: 'garages-vs-street.html', title: 'The Benefits of Parking Garages vs. Street Parking', category: 'urban-planning' },
  { file: 'design-lot.html', title: 'Designing a Smart and Efficient Parking Lot', category: 'urban-planning' },
  { file: 'park-and-ride.html', title: 'Exploring "Park-and-Ride" Systems', category: 'urban-planning' },
  { file: 'impact-businesses.html', title: 'The Impact of Parking on Local Businesses', category: 'urban-planning' },
  { file: 'parking-permits.html', title: 'Understanding Parking Permits and Zones', category: 'urban-planning' },
  { file: 'challenge-planners.html', title: 'The Challenge of Parking for City Planners', category: 'urban-planning' },

  // Category 5: Safety & Security
  { file: 'car-safety.html', title: 'Tips for Keeping Your Car Safe in a Parking Lot', category: 'safety-security' },
  { file: 'avoid-robbery.html', title: 'How to Avoid a Parking Lot Robbery', category: 'safety-security' },
  { file: 'good-lighting.html', title: 'The Importance of Good Lighting in Parking Areas', category: 'safety-security' },
  { file: 'vehicle-alarms.html', title: 'A Guide to Vehicle Alarms and Security Systems', category: 'safety-security' },
  { file: 'witness-crime.html', title: 'What to Do If You Witness a Crime in a Parking Lot', category: 'safety-security' },
  { file: 'parking-scams.html', title: 'Recognizing and Reporting Parking Lot Scams', category: 'safety-security' },
  { file: 'security-cameras.html', title: 'The Role of Security Cameras in Parking Safety', category: 'safety-security' },
  { file: 'safest-place-night.html', title: 'The Safest Place to Park Your Car at Night', category: 'safety-security' },
  { file: 'dents-scratches.html', title: 'Dealing with Minor Dents and Scratches in a Parking Lot', category: 'safety-security' },
  { file: 'emergency-preparedness.html', title: 'Emergency Preparedness: What to Do in a Parking Lot Incident', category: 'safety-security' }
];

// === 3. Define Internal Linking Map ===
const relatedLinks = {
  'parking-tickets.html': ['dispute-ticket.html', 'avoid-tickets.html'],
  'dispute-ticket.html': ['parking-tickets.html', 'parking-laws.html'],
  'avoid-tickets.html': ['parking-tickets.html', 'parking-laws.html'],
  'parking-laws.html': ['urban-cost.html', 'public-vs-private.html'],
  'urban-cost.html': ['pay-smart.html', 'parking-tickets.html'],
  'pay-smart.html': ['contactless-payments.html', 'parking-apps.html'],
  'contactless-payments.html': ['pwa-benefits.html', 'pay-smart.html'],
  'parking-apps.html': ['geolocation.html', 'pwa-benefits.html'],
  'geolocation.html': ['smart-parking.html', 'parking-apps.html'],
  'smart-parking.html': ['ai-parking.html', 'sensors.html'],
  'ai-parking.html': ['future-enforcement.html', 'smart-parking.html'],
  'robotic-parking.html': ['smart-parking.html', 'garages-vs-street.html'],
  'self-parking-cars.html': ['ai-parking.html', 'ev-parking.html'],
  'ev-parking.html': ['charging-stations.html', 'electric-vehicles.html'],
  'pwa-benefits.html': ['parking-apps.html', 'contactless-payments.html'],
  'evolution.html': ['solving-parking.html', 'future-enforcement.html'],
  'solving-parking.html': ['traffic-congestion.html', 'urban-development.html'],
  'urban-development.html': ['sustainable-solutions.html', 'parking-permits.html'],
  'sustainable-solutions.html': ['ev-parking.html', 'green-cities.html'],
  'traffic-congestion.html': ['cruising-for-parking.html', 'solving-parking.html'],
  'garages-vs-street.html': ['design-lot.html', 'park-and-ride.html'],
  'design-lot.html': ['sustainable-solutions.html', 'garages-vs-street.html'],
  'park-and-ride.html': ['solving-parking.html', 'traffic-congestion.html'],
  'impact-businesses.html': ['urban-development.html', 'parking-permits.html'],
  'parking-permits.html': ['residential-permits.html', 'parking-laws.html'],
  'challenge-planners.html': ['urban-development.html', 'solving-parking.html'],
  'car-safety.html': ['personal-safety.html', 'vehicle-alarms.html'],
  'avoid-robbery.html': ['personal-safety.html', 'good-lighting.html'],
  'good-lighting.html': ['security-cameras.html', 'safest-place-night.html'],
  'vehicle-alarms.html': ['car-safety.html', 'security-cameras.html'],
  'witness-crime.html': ['avoid-robbery.html', 'parking-scams.html'],
  'parking-scams.html': ['witness-crime.html', 'personal-safety.html'],
  'security-cameras.html': ['good-lighting.html', 'vehicle-alarms.html'],
  'safest-place-night.html': ['avoid-robbery.html', 'personal-safety.html'],
  'dents-scratches.html': ['lot-rights.html', 'towing-legal.html'],
  'emergency-preparedness.html': ['witness-crime.html', 'dents-scratches.html']
};

// === 4. Generate JSON-LD Breadcrumb ===
function generateBreadcrumb(article, categories) {
  const category = categories[article.category];
  const baseUrl = 'https://parking-pwa-eight.vercel.app';
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Learn & Tips",
      "item": "${baseUrl}/learn.html"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "${category.name}",
      "item": "${baseUrl}/learn.html#${category.id}"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "${article.title}"
    }
  ]
}
</script>`;
}

// === 5. Generate Internal Links ===
function generateRelatedLinks(filename, articles, relatedLinks) {
  const links = relatedLinks[filename];
  if (!links) return '';
  const linkTexts = links
    .filter(link => articles.some(a => a.file === link))
    .map(link => {
      const target = articles.find(a => a.file === link);
      return `<a href="${link}">${target?.title}</a>`;
    });
  if (linkTexts.length === 0) return '';
  return `<p class="related-articles"><strong>You might also like:</strong> ${linkTexts.join(' and ')}.</p>`;
}

// === 6. Update All Articles ===
function updateArticles() {
  const articleDir = path.join(__dirname, 'article');
  if (!fs.existsSync(articleDir)) {
    console.error('❌ Article directory not found:', articleDir);
    return;
  }

  articles.forEach(article => {
    const filePath = path.join(articleDir, article.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove existing JSON-LD and related links if present
    content = content.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*<p class="related-articles">[\s\S]*?<\/p>/g, '');
    content = content.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    content = content.replace(/<p class="related-articles">[\s\S]*?<\/p>/g, '');

    // Find the position to inject (before </div> of .container)
    const backBtnIndex = content.indexOf('<a href="../learn.html" class="back-btn">');
    if (backBtnIndex === -1) {
      console.warn(`⚠️  Back button not found in ${article.file}, skipping...`);
      return;
    }

    // Generate new content
    const breadcrumb = generateBreadcrumb(article, categories);
    const related = generateRelatedLinks(article.file, articles, relatedLinks);

    // Inject before back button
    const insertPosition = content.lastIndexOf('</div>', backBtnIndex);
    const newContent = content.slice(0, insertPosition) + 
      `\n\n${breadcrumb}\n\n${related}\n` + 
      content.slice(insertPosition);

    // Write updated file
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Updated: ${article.file}`);
  });

  console.log('\n🎉 All articles updated with breadcrumbs and internal links!');
  console.log('📌 Next: Deploy your updated /article/ folder to Vercel.');
}

// === Run the Script ===
updateArticles();