# RAG PDF Chat - Frontend

A beautiful, minimalistic, and scalable frontend for the RAG-based PDF chatting application built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui.

## ✨ Features

- 🎨 **Beautiful UI**: Clean, minimalistic design with shadcn/ui components
- 🌓 **Dark/Light Mode**: Seamless theme switching with persistent preferences
- 📱 **Fully Responsive**: Mobile-first design that works on all devices
- 🚀 **Fast & Optimized**: Built with Next.js 14 App Router for optimal performance
- 🔐 **Secure Authentication**: JWT-based auth with protected routes
- 📄 **PDF Management**: Drag & drop upload, status tracking, and management
- 💬 **Real-time Chat**: Interactive chat interface with markdown support
- 🎯 **Type-Safe**: Full TypeScript support for better DX
- 📊 **State Management**: Zustand for efficient global state
- 🎭 **Smooth Animations**: Framer Motion for delightful interactions

## 🏗️ Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── chat/[id]/           # Chat page
│   ├── dashboard/           # Dashboard page
│   ├── login/               # Login page
│   ├── register/            # Register page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
│
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Layout components
│   └── providers/           # Context providers
│
├── lib/                     # Utilities
│   ├── services/            # API services
│   ├── store/               # Zustand stores
│   ├── api.ts               # Axios instance
│   └── utils.ts             # Utility functions
│
└── public/                  # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on `http://localhost:3000`

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3001](http://localhost:3001)

## 📦 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety and better DX |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Beautiful, accessible UI components |
| **Zustand** | Lightweight state management |
| **Axios** | HTTP client for API calls |
| **next-themes** | Dark/Light mode support |
| **react-markdown** | Markdown rendering in chat |
| **react-dropzone** | Drag & drop file upload |
| **framer-motion** | Smooth animations |
| **sonner** | Toast notifications |
| **lucide-react** | Beautiful icons |

## 🎨 Pages

### 1. Landing Page (`/`)
- Hero section with CTA
- Features showcase
- Responsive design
- Theme toggle

### 2. Login (`/login`)
- Email/password form
- Form validation
- Error handling
- Auto-redirect after login

### 3. Register (`/register`)
- Name/email/password form
- Password requirements
- Form validation
- Auto-redirect after registration

### 4. Dashboard (`/dashboard`)
- Statistics cards (Total PDFs, Ready, Processing)
- Drag & drop PDF upload
- PDF list with status indicators
- Click to chat with completed PDFs
- Logout functionality

### 5. Chat (`/chat/[id]`)
- Real-time chat interface
- Message history
- Markdown support for AI responses
- Context/source display
- Loading states
- Back to dashboard

## 🔐 Authentication Flow

```
1. User visits landing page
2. Click "Get Started" or "Login"
3. Fill credentials and submit
4. API call to backend
5. Store token and user in localStorage + Zustand
6. Redirect to dashboard
7. Protected routes check authentication
8. Logout clears state and redirects to home
```

## 📄 PDF Upload Flow

```
1. User drags/selects PDF file
2. Validate file type and size
3. Upload to backend API
4. Backend uploads to Cloudinary
5. Backend queues processing job
6. Frontend receives PDF metadata
7. Add to PDF list with "pending" status
8. User can see status updates
9. When "completed", user can chat
```

## 💬 Chat Flow

```
1. User clicks on completed PDF
2. Navigate to /chat/[pdfId]
3. Load chat interface
4. User types message and sends
5. Display user message immediately
6. Show "Thinking..." loader
7. API call to backend
8. Backend generates response with RAG
9. Display AI response with markdown
10. Show source pages and relevance scores
11. Save to chat history
```

## 🎯 State Management

### Auth Store (`authStore.ts`)
- `user`: User object or null
- `token`: JWT token
- `isAuthenticated`: boolean
- `setAuth(user, token)`: Set authentication
- `logout()`: Clear authentication

### PDF Store (`pdfStore.ts`)
- `pdfs`: Array of PDF objects
- `currentPDF`: Selected PDF
- `setPDFs(pdfs)`: Set all PDFs
- `addPDF(pdf)`: Add new PDF
- `updatePDF(id, updates)`: Update PDF
- `removePDF(id)`: Remove PDF
- `setCurrentPDF(pdf)`: Set current PDF

### Chat Store (`chatStore.ts`)
- `messages`: Array of messages
- `sessionId`: Current session ID
- `isLoading`: boolean
- `setMessages(messages)`: Set messages
- `addMessage(message)`: Add message
- `setSessionId(id)`: Set session
- `setIsLoading(bool)`: Set loading state
- `clearChat()`: Clear chat

## 🎨 Theme Support

The app supports both light and dark modes:

- **System Preference**: Automatically detects system theme
- **Manual Toggle**: Click theme toggle button in header
- **Persistent**: Theme preference saved in localStorage
- **No Flash**: Prevents flash of unstyled content
- **Smooth Transitions**: Animated theme switching

## 📱 Responsive Design

Mobile-first approach with breakpoints:
- **sm**: 640px (Small tablets)
- **md**: 768px (Tablets)
- **lg**: 1024px (Laptops)
- **xl**: 1280px (Desktops)
- **2xl**: 1536px (Large screens)

## 🔧 API Integration

All API calls go through the `lib/api.ts` axios instance:

- **Base URL**: From environment variable
- **Auth Headers**: Automatically adds JWT token
- **Error Handling**: Intercepts 401 errors and logs out
- **Consistent**: All services use the same instance

## 🎭 UI Components

### shadcn/ui Components Used:
- **Button**: Primary actions, variants
- **Input**: Form inputs
- **Card**: Content containers
- **Badge**: Status indicators (planned)
- **Dialog**: Modals (planned)
- **DropdownMenu**: User menu (planned)
- **Progress**: Upload progress (planned)
- **Skeleton**: Loading states (planned)
- **ScrollArea**: Scrollable content (planned)
- **Separator**: Visual dividers (planned)

## 🚀 Build & Deploy

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Or use Vercel CLI:
```bash
vercel
```

## 📊 Performance Optimizations

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Google Fonts with next/font
- **Lazy Loading**: React.lazy for heavy components
- **Caching**: SWR or React Query (can be added)
- **Compression**: Automatic in production

## 🔒 Security Best Practices

- **XSS Protection**: React's built-in escaping
- **CSRF**: Token-based auth (stateless)
- **Secure Storage**: HttpOnly cookies (can be implemented)
- **Input Validation**: Client-side validation
- **Environment Variables**: Sensitive data in .env
- **HTTPS**: Required in production

## 🐛 Troubleshooting

### Backend Connection Issues
- Ensure backend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is enabled in backend

### Authentication Issues
- Clear localStorage and try again
- Check JWT token expiration
- Verify backend auth endpoints

### Upload Issues
- Check file size (max 10MB)
- Verify file type is PDF
- Check backend upload limits

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 🎯 Future Enhancements

- [ ] PDF preview in chat
- [ ] Export chat history
- [ ] User settings page
- [ ] Email verification
- [ ] Password reset
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Collaborative features
- [ ] Mobile app (React Native)

## 📄 License

ISC

## 👨‍💻 Author

Your Name

---

**Note**: Make sure your backend is running before starting the frontend!

For backend setup, see `/backend/README.md`
