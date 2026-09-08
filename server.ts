import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

// Very long description for the app
const LONG_APP_DESCRIPTION = `LUGA BOYZ is the ultimate digital ecosystem and social architecture designed specifically for the vibrant community of Mwanalugali Secondary School. This platform is not just a social network; it is a comprehensive hub for academic excellence, social interaction, and community building.
Through LUGA BOYZ, students can connect with their peers across different streams like PCM, PCB, HKL, HGLi, HGL, HGE, and HGV, fostering a sense of unity and shared purpose.
The platform features a real-time Match Center where upcoming inter-class football matches, debates, and academic decathlons are scheduled, allowing students to RSVP and stay updated.
Additionally, the Study Hub acts as a centralized Resource Vault, enabling students to share vital academic materials, past papers, and study notes seamlessly using external cloud storage links.
We have integrated a direct gateway to the official NECTA Results portal, empowering students to check their CSEE and ACSEE results instantly without leaving the app.
The intuitive Faction Wars leaderboard introduces a gamified experience, tracking points and engagement across different classes to crown the ultimate stream champions each week.
For communication, LUGA BOYZ offers a robust, real-time messaging system featuring 'View Once' image sharing, ensuring privacy and control over personal media.
The Home Feed is a dynamic timeline of community updates, challenges, and personal achievements, allowing users to like, comment, and share moments that matter.
Every post can be shared externally, dynamically generating preview metadata so that links dropped in WhatsApp or Twitter display the exact post content and attached media.
Security and moderation are paramount; users can edit or delete their comments, report inappropriate content, and manage their profiles with deep customization.
The platform embraces modern design principles, offering both a sleek dark mode and a high-contrast light mode to suit any user preference at any time of day.
Push notifications and in-app toast alerts keep users informed of every interaction—be it a new follower, a like on their post, or a direct message—so nothing is missed.
LUGA BOYZ is built as a Progressive Web App (PWA), meaning it can be installed directly to a smartphone's home screen for an app-like experience, complete with offline capabilities.
We believe in empowering the student body, giving them the digital tools necessary to organize, communicate, and thrive in an increasingly connected educational environment.
This is a space where academic rigor meets vibrant school culture, where every student has a voice, and where the legacy of Mwanalugali Secondary School is digitized.
From coordinating group study sessions to cheering on the sidelines of the inter-stream finals, LUGA BOYZ is the heartbeat of the student community.
The challenges module encourages students to step out of their comfort zones, participate in creative or academic prompts, and earn recognition from their peers.
Profile customization allows users to showcase their achievements, badges, and stream affiliation, building a personal digital identity that reflects their real-world accomplishments.
Our commitment to privacy means that user data is handled securely, and features like disappearing messages put the power back in the hands of the users.
The seamless integration of Firebase ensures that the app remains lightning-fast, highly scalable, and capable of handling the demands of an active student body.
LUGA BOYZ is more than an app; it is a movement towards digital literacy, community engagement, and modern educational connectivity.
We are constantly evolving, listening to user feedback, and rolling out new features to make the LUGA BOYZ experience even more indispensable.
Whether you're looking to catch up on the latest school news, find a study partner, or just share a funny moment from the day, this is the place to be.
The Faction Wars don't just build rivalry; they build camaraderie, pushing streams to collaborate and excel both academically and socially to claim the top spot.
With a dedicated section for NECTA results, we aim to reduce the anxiety of results day by providing a fast, reliable, and integrated lookup tool.
The Study Hub's upvote system ensures that the best, most accurate, and most helpful resources naturally rise to the top, creating a self-curating library of knowledge.
Every line of code in LUGA BOYZ is written with the Mwanalugali student in mind, prioritizing speed, accessibility, and intuitive design.
As we look to the future, LUGA BOYZ will continue to pioneer new ways for students to connect, learn, and grow together in a digital-first world.
Welcome to the future of student life at Mwanalugali Secondary School. Welcome to LUGA BOYZ.
This is our community. This is our legacy. This is our platform.`;

async function fetchPostMetadata(postId: string) {
  try {
    // We use the Firestore REST API to avoid initializing the Firebase Admin SDK
    const projectId = "ai-studio-remixremixlugabo-ad5d8841-85ca-402e-98c9-e65669a86864";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.fields;
  } catch (error) {
    console.error("Error fetching post metadata:", error);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
  }

  // Intercept the root route to inject dynamic OpenGraph tags
  app.get("/", async (req, res, next) => {
    try {
      const postId = req.query.post as string;
      
      let template: string;
      if (process.env.NODE_ENV !== "production") {
        template = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.url, template);
      } else {
        template = await fs.readFile(path.resolve(process.cwd(), "dist/index.html"), "utf-8");
      }

      // Default Meta Tags
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const logoUrl = `${baseUrl}/pwa-512x512.png`;
      
      let title = "LUGA BOYZ | Mwanalugali Hub";
      let description = LONG_APP_DESCRIPTION;
      let imageUrl = logoUrl;
      
      // If a specific post is requested, fetch it and update meta tags
      if (postId) {
        const post = await fetchPostMetadata(postId);
        if (post) {
          const content = post.content?.stringValue || "";
          // Determine the image/video to show
          if (post.imageUrl?.stringValue) {
            imageUrl = post.imageUrl.stringValue;
          } else if (post.videoUrl?.stringValue) {
            imageUrl = post.videoUrl.stringValue; // Video thumbnail fallback (or actual video if platform supports)
          }
          
          title = "LUGA BOYZ | View Post";
          description = content.length > 300 ? content.substring(0, 300) + "..." : content;
        }
      }

      // Replace generic meta tags with our dynamic ones
      const ogTags = `
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${baseUrl}${req.url}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${imageUrl}" />
        <meta name="description" content="${description}" />
      `;

      // Insert right before </head>
      const finalHtml = template.replace('</head>', `${ogTags}</head>`);
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
    } catch (e) {
      if (vite) {
        vite.ssrFixStacktrace(e);
      }
      next(e);
    }
  });

  // Serve other static files
  if (process.env.NODE_ENV !== "production") {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // We already handled / above, now handle other static files
    app.use(express.static(distPath, { index: false })); 
    // Fallback for SPA routing
    app.get('*', async (req, res) => {
      try {
        const template = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        res.status(500).end('Internal Server Error');
      }
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
