# 📱 Shubham Computers Mobile App

A beautiful, professional React Native mobile application built with Expo, featuring complete parity with the web frontend for print services, mart shopping, and digital solutions.

## ✨ Features

### 🖨️ Print Services
- **Document Printing**: Upload and print documents with custom configurations
- **Passport Photos**: Professional passport photo service with instant booking
- **On-Demand Printing**: Quick printing solutions with 30-minute delivery
- **Print Store**: Browse and order from a wide range of print services

### 🛒 Digital Mart
- **Product Catalog**: Browse electronics, accessories, and digital products
- **Category Navigation**: Organized product categories for easy shopping
- **Shopping Cart**: Add, remove, and manage cart items
- **Quick Add**: One-tap product addition to cart

### 💳 Wallet & Payments
- **Digital Wallet**: Secure wallet system for payments
- **UPI Integration**: Seamless UPI payment processing
- **Transaction History**: Complete order and payment tracking
- **Balance Management**: Easy wallet top-up functionality

### 👤 User Management
- **OTP Authentication**: Secure phone-based login system
- **Profile Management**: Complete user profile with address management
- **Location Services**: GPS-based service area verification
- **Order Tracking**: Real-time order status updates

### 🔧 Admin Features
- **Dashboard**: Comprehensive admin dashboard with analytics
- **Order Management**: Process and track all customer orders
- **Product Management**: Add, edit, and manage product catalog
- **User Management**: Customer support and user administration

## 🎨 Design System

### Dark Theme UI
- **Modern Dark Interface**: Consistent with web frontend
- **Professional Color Palette**: Purple primary (#6C63FF) with accent colors
- **Typography Scale**: Consistent font weights and sizes
- **Component Library**: Reusable UI components (Button, Card, Input, Badge)

### Visual Polish
- **Smooth Animations**: React Native Reanimated for fluid interactions
- **Shadow Effects**: Consistent elevation and depth
- **Linear Gradients**: Beautiful gradient buttons and banners
- **Icon System**: Expo Vector Icons (Feather, MaterialCommunityIcons)

## 🏗️ Architecture

### Navigation Structure
```
RootNavigator
├── AuthStack (Login)
└── MainTabs
    ├── HomeStack (Home, PrintStore, Services, etc.)
    ├── OrdersStack (Orders, Order Details)
    ├── ProfileStack (Profile, Wallet)
    └── AdminStack (Dashboard, Management) [Admin Only]
```

### State Management
- **AuthContext**: Global authentication and cart state
- **AsyncStorage**: Persistent token and user data storage
- **API Client**: Axios with automatic token injection and 401 handling

### Key Components
- **LocationPicker**: GPS-based location selection with Nominatim
- **FileUpload**: Document and image upload with validation
- **SearchBar**: Real-time product and service search
- **AIBubble**: Floating AI chat assistance
- **LoadingScreen**: Consistent loading states

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator

### Installation
```bash
cd mobile
npm install
```

### Environment Setup
Create a `.env` file in the mobile directory:
```env
EXPO_PUBLIC_API_URL=http://your-backend-url/api
```

### Development
```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android  
npm run android
```

## 📱 Platform Support

### iOS
- **iOS 13.0+**: Minimum supported version
- **iPhone & iPad**: Universal app support
- **Dark Mode**: Automatic dark interface
- **Safe Areas**: Proper notch and home indicator handling

### Android
- **API Level 21+**: Android 5.0 minimum
- **Edge-to-Edge**: Modern Android UI guidelines
- **Adaptive Icons**: Dynamic icon theming
- **Permissions**: Location and media access

## 🔧 Configuration

### App Configuration (`app.json`)
- **Dark UI Style**: Consistent dark theme
- **Splash Screen**: Custom branded splash with dark background
- **Permissions**: Location, camera, and media library access
- **Navigation**: Gesture handling and screen transitions

### Babel Configuration
- **Reanimated Plugin**: Required for smooth animations
- **Expo Preset**: Standard Expo babel configuration

## 🌐 API Integration

### Authentication Flow
1. **Name Collection**: User provides full name
2. **Phone Verification**: OTP sent via SMS
3. **Profile Completion**: Address and additional details
4. **Token Management**: JWT stored in AsyncStorage

### Endpoint Parity
All API endpoints mirror the web frontend:
- `/auth/*` - Authentication endpoints
- `/print-services` - Print service catalog
- `/products/*` - Product and category management
- `/orders/*` - Order processing and tracking
- `/wallet/*` - Wallet and payment operations

### Error Handling
- **Network Errors**: Graceful offline handling
- **401 Unauthorized**: Automatic logout and redirect
- **Validation Errors**: User-friendly error messages
- **Toast Notifications**: Non-intrusive feedback system

## 🎯 Performance Optimizations

### Bundle Size
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Compressed assets and lazy loading
- **Code Splitting**: Dynamic imports for admin features

### Runtime Performance
- **FlatList**: Efficient list rendering for large datasets
- **Image Caching**: Automatic image caching and fallbacks
- **Memory Management**: Proper cleanup of listeners and timers

## 🔒 Security Features

### Data Protection
- **Token Security**: Secure storage in AsyncStorage
- **Input Validation**: Client-side validation with server verification
- **Permission Handling**: Proper iOS/Android permission requests

### Privacy
- **Location Privacy**: Location used only for service area verification
- **Data Minimization**: Only necessary user data collected
- **Secure Communication**: HTTPS API communication

## 📋 Testing

### Manual Testing Checklist
- [ ] Authentication flow (name → phone → OTP → profile)
- [ ] Location permission and service area detection
- [ ] Print service ordering with file upload
- [ ] Product browsing and cart management
- [ ] Wallet operations and UPI payments
- [ ] Order tracking and status updates
- [ ] Admin features (if admin user)
- [ ] Offline behavior and error handling

## 🚀 Deployment

### Production Build
```bash
# Create production build
expo build:android
expo build:ios

# Or with EAS Build
eas build --platform all
```

### App Store Submission
- **iOS**: Submit via App Store Connect
- **Android**: Upload to Google Play Console
- **Screenshots**: Generate marketing screenshots
- **Metadata**: App description and keywords

## 🤝 Contributing

### Development Guidelines
- Follow existing code style and patterns
- Test on both iOS and Android platforms
- Maintain design system consistency
- Update documentation for new features

### Code Structure
```
src/
├── api/           # API client and configuration
├── components/    # Reusable UI components
├── context/       # Global state management
├── navigation/    # Navigation configuration
├── screens/       # Screen components
├── theme/         # Design tokens and styles
└── utils/         # Utility functions and constants
```

## 📄 License

This project is part of the Shubham Computers ecosystem. All rights reserved.

---

Built with ❤️ using React Native and Expo