# School Result Management System

A modern web application for managing and tracking Nigeria school term results for students. Built with React, TypeScript, and Vite.

## Features

### 🎓 Core Features
- **Secure Authentication**: Teacher login system with session management
- **Multi-Class Dashboard**: Separate tabs for managing results across 6 different classes
- **Automatic Calculation**: Automatic sum of CA1, CA2, and Exam scores
- **Ranking System**: Automatic ranking of students based on total scores per subject
- **7 Subjects Support**: English, Mathematics, Science, History, Geography, Civic Studies, Physical Education
- **30 Student Capacity**: Manage results for up to 30 pupils per class
- **Word Export**: Export individual student result sheets as Word documents with:
  - Student information
  - All 7 subjects with scores and rankings
  - Teacher comment section
  - Head of School signature space
  - Automatic formatting and professional layout
- **Data Persistence**: All results are saved to browser localStorage

### 🎨 UI/UX Features
- Responsive design for desktop and tablet
- Smooth navigation between classes
- Real-time score calculation and ranking
- Form validation and error handling
- Professional color scheme and animations

## Tech Stack

- **Frontend Framework**: React 19.2.5
- **Language**: TypeScript
- **Build Tool**: Vite 8.0.10
- **Routing**: React Router DOM 6.28.0
- **Document Generation**: docx 8.13.1
- **Styling**: CSS3 with modern flexbox and grid

## Project Structure

```
src/
├── components/
│   ├── LoginPage.tsx          # Login form component
│   ├── LoginPage.css          # Login styling
│   ├── Dashboard.tsx          # Main dashboard layout
│   ├── Dashboard.css          # Dashboard styling
│   ├── ProtectedRoute.tsx     # Route protection component
│   ├── ResultTabContent.tsx   # Class result content
│   ├── ResultTabContent.css   # Result content styling
│   ├── ResultsTable.tsx       # Results table component
│   ├── ResultsTable.css       # Table styling
│   ├── ResultForm.tsx         # Form for adding pupils
│   └── ResultForm.css         # Form styling
├── contexts/
│   └── AuthContext.tsx        # Authentication state management
├── utils/
│   └── wordExport.ts          # Word document generation utilities
├── App.tsx                    # Main app component
├── App.css                    # Global styles
└── main.tsx                   # Entry point
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. Navigate to the project directory:
```bash
cd "School result system"
```

2. Install dependencies (already completed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Demo Login

The system currently uses demo authentication:
- **Email**: Any valid email format (e.g., teacher@school.com)
- **Password**: Any password
- **Click Login** to proceed to the dashboard

## Usage Guide

### 1. Login
- Enter your email and password
- Click the **Login** button
- You'll be redirected to the dashboard

### 2. Select a Class
- Use the sidebar tabs on the left to select from Classes 1-6
- Each class has separate result management

### 3. Enter Scores
- **Select a Subject** from the subject tabs
- **Enter Scores** for each student:
  - CA1 (Continuous Assessment 1): 0-10 points
  - CA2 (Continuous Assessment 2): 0-10 points
  - Exam: 0-50 points
- **Total Score** (CA1 + CA2 + Exam) is calculated automatically
- **Rankings** are automatically assigned based on total scores

### 4. Export Results
- Click the **Export to Word** button to generate a Word document
- The document includes:
  - School name and title
  - Student information and class
  - All 7 subjects with complete scores and rankings
  - Teacher comment section
  - Head of School signature area

### 5. Data Persistence
- All entered data is automatically saved to your browser's local storage
- Data persists even after closing the browser
- Each class has separate data storage

## Scoring System

### Maximum Scores
- **CA1 (First Assessment)**: 10 points
- **CA2 (Second Assessment)**: 10 points
- **Exam**: 50 points
- **Total**: 70 points per subject

### Ranking
- Ranking is calculated per subject per class
- Rank 1 displays with gold badge
- Rank 2 displays with silver badge
- Rank 3 displays with bronze badge

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Advanced Features

### Authentication
The auth system uses React Context for state management and includes:
- User session storage in localStorage
- Automatic redirect to login if session expires
- Error handling and user feedback

### Word Document Export
The export feature generates professional Word documents with:
- Proper formatting and borders
- Table structures for score presentation
- Signature and comment sections
- Support for all 7 subjects

### Data Management
Results are stored in browser localStorage with the following structure:
```
Key: class-{classId}-results
Value: Array of pupil objects with subject scores
```

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

Planned features for future releases:
- Backend API integration for persistent storage
- Multi-school support
- Class performance analytics and charts
- Student progress tracking
- Email result delivery
- PDF export option
- Digital signature support
- Custom school branding
- Report cards generation
- API for integration with other school systems

## Troubleshooting

### Issue: Results not saving
**Solution**: Check if browser allows localStorage. Clear browser cache and try again.

### Issue: Export button not working
**Solution**: Ensure you have entered at least one score. The export feature requires valid data.

### Issue: Can't login
**Solution**: The demo system accepts any valid email format. Make sure your email contains the "@" symbol.

## Support

For issues or questions, please check the component files for detailed comments and implementation details.

## License

This project is created for educational purposes.

## Author

Created for Nigeria School Result Management System - 2026

---

**Version**: 1.0.0  
**Last Updated**: April 23, 2026
