export const typeDefs = `#graphql
  enum UserRole {
    CUSTOMER
    PROVIDER
    ADMIN
  }

  enum BookingStatus {
    PENDING
    ACCEPTED
    REJECTED
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  enum VerificationStatus {
    PENDING
    VERIFIED
    REJECTED
  }

  enum DisputeStatus {
    PENDING
    RESOLVED
    CANCELLED
  }

  type Location {
    type: String!
    coordinates: [Float!]!
  }

  input LocationInput {
    coordinates: [Float!]!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    isEmailVerified: Boolean!
    avatar: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    password: String
  }

  type Provider {
    id: ID!
    user: User!
    businessName: String!
    description: String!
    category: Category
    services: [Service!]!
    location: Location!
    address: String!
    verificationStatus: VerificationStatus!
    rating: Float!
    reviewsCount: Int!
    phone: String!
    whatsapp: String
    subscriptionPlan: String!
    subscriptionStatus: String!
    subscriptionExpiry: String
    banner: String
    portfolio: [String!]
    createdAt: String!
    updatedAt: String!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    icon: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Service {
    id: ID!
    provider: Provider!
    category: Category
    name: String!
    description: String!
    price: Float!
    duration: Int
    images: [String!]!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type BookingLocation {
    address: String!
    coordinates: [Float!]!
  }

  input BookingLocationInput {
    address: String!
    coordinates: [Float!]!
  }

  type Booking {
    id: ID!
    customer: User!
    provider: Provider!
    service: Service!
    bookingDate: String!
    status: BookingStatus!
    location: BookingLocation!
    totalPrice: Float!
    notes: String
    paymentStatus: String!
    paymentDetails: String
    createdAt: String!
    updatedAt: String!
  }

  type Review {
    id: ID!
    booking: Booking!
    customer: User!
    provider: Provider!
    rating: Int!
    comment: String
    createdAt: String!
    updatedAt: String!
  }

  type Conversation {
    id: ID!
    participants: [User!]!
    lastMessage: Message
    createdAt: String!
    updatedAt: String!
  }

  type Message {
    id: ID!
    conversation: ID!
    sender: User!
    text: String!
    attachments: [String!]!
    readBy: [ID!]!
    createdAt: String!
    updatedAt: String!
  }

  type Notification {
    id: ID!
    recipient: User!
    sender: User
    title: String!
    message: String!
    type: String!
    read: Boolean!
    link: String
    createdAt: String!
    updatedAt: String!
  }

  type Dispute {
    id: ID!
    booking: Booking!
    raisedBy: User!
    reason: String!
    status: DisputeStatus!
    resolutionDetails: String
    createdAt: String!
    updatedAt: String!
  }

  type Banner {
    id: ID!
    title: String!
    imageUrl: String!
    link: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type TokenPayload {
    accessToken: String!
    refreshToken: String!
  }

  type DashboardStats {
    usersCount: Int!
    bookingsCount: Int!
    disputesCount: Int!
    totalRevenue: Float!
  }

  type Payment {
    id: ID!
    provider: Provider!
    plan: String!
    amount: Float!
    method: String!
    status: String!
    transactionId: String
    createdAt: String!
  }

  type LocationUpdatedPayload {
    providerId: ID!
    coordinates: [Float!]!
  }

  input ProviderRegisterInput {
    businessName: String!
    description: String!
    category: ID!
    address: String!
    phone: String!
    whatsapp: String
    coordinates: [Float!]!
  }

  type ProviderDashboardStats {
    totalEarnings: Float!
    pendingTasks: Int!
    completedJobs: Int!
    averageRating: Float!
    subscriptionPlan: String
    subscriptionStatus: String
    subscriptionExpiry: String
  }

  type Query {
    # Auth & Users
    me: User

    # Providers
    providers(longitude: Float, latitude: Float, maxDistance: Float, category: ID): [Provider!]!
    providerDetails(id: ID!): Provider
    providerProfile(userId: ID!): Provider
    providerReviews(providerUserId: ID!): [Review!]!
    providerDashboardStats: ProviderDashboardStats!

    # Categories
    categories: [Category!]!

    # Services
    services(providerId: ID!): [Service!]!
    serviceDetails(id: ID!): Service
    globalServices(category: ID, search: String): [Service!]!

    # Bookings
    bookings: [Booking!]!
    bookingDetails(id: ID!): Booking

    # Chat
    conversations: [Conversation!]!
    messages(conversationId: ID!, limit: Int, page: Int): [Message!]!

    # Notifications
    notifications(limit: Int, page: Int): [Notification!]!

    # Admin
    adminUsers: [User!]!
    adminBanners: [Banner!]!
    adminReviews: [Review!]!
    adminProviders: [Provider!]!
    adminDisputes: [Dispute!]!
    adminDashboardStats: DashboardStats!
    adminConversations: [Conversation!]!
    adminMessages(conversationId: ID!, limit: Int, page: Int): [Message!]!
    getPaymentsReport: [Payment!]!
    
    # Public
    publicReviews(limit: Int): [Review!]!
    publicBanners: [Banner!]!
  }

  type Mutation {
    # Auth
    register(
      name: String!
      email: String!
      password: String!
      role: UserRole!
      providerDetails: ProviderRegisterInput
    ): AuthPayload!

    login(email: String!, password: String!): AuthPayload!
    googleLogin(token: String!, role: UserRole): AuthPayload!
    logout: Boolean!
    refreshToken(token: String!): TokenPayload!
    forgotPassword(email: String!): Boolean!
    verifyOTP(email: String!, otp: String!): Boolean!
    resetPassword(email: String!, otp: String!, password: String!): Boolean!
    changePassword(oldPassword: String!, newPassword: String!): Boolean!

    # Users / Providers
    updateUserAvatar(avatar: String!): User!
    updateLocation(longitude: Float!, latitude: Float!): Provider!

    # Admin Categories CRUD
    createCategory(name: String!, icon: String): Category!
    updateCategory(id: ID!, name: String!, icon: String, isActive: Boolean): Category!
    deleteCategory(id: ID!): Boolean!

    # Admin Banners CRUD
    createBanner(title: String!, imageUrl: String!, link: String): Banner!
    updateBanner(id: ID!, title: String!, imageUrl: String!, link: String, isActive: Boolean): Banner!
    deleteBanner(id: ID!): Boolean!

    # Admin Reviews
    deleteReview(id: ID!): Boolean!

    # Admin Dispute & Verification
    verifyProvider(providerId: ID!, status: VerificationStatus!): Provider!
    resolveDispute(disputeId: ID!, resolutionDetails: String!): Dispute!

    # Services
    createService(category: ID!, name: String!, description: String!, price: Float!, duration: Int, images: [String!]): Service!
    updateService(id: ID!, category: ID, name: String, description: String, price: Float, duration: Int, images: [String!], isActive: Boolean): Service!
    deleteService(id: ID!): Boolean!
    requestPayout(amount: Float!): Boolean!

    # Provider
    updateProviderProfile(businessName: String, description: String, address: String, portfolio: [String!]): Provider!
    selectSubscriptionPlan(plan: String!): Provider!
    processPayment(method: String!): Provider!

    # Bookings
    createBooking(serviceId: ID!, bookingDate: String!, address: String!, coordinates: [Float!]!, notes: String): Booking!
    updateBookingStatus(bookingId: ID!, status: BookingStatus!): Booking!

    # Reviews
    addReview(bookingId: ID!, rating: Int!, comment: String): Review!

    # Chat
    getOrCreateConversation(userId: ID!): Conversation!
    sendMessage(recipientId: ID!, text: String!, attachments: [String!]): Message!
    triggerTyping(conversationId: ID!, isTyping: Boolean!): Boolean!

    # Notifications
    markAllNotificationsAsRead: Boolean!
    markNotificationAsRead(id: ID!): Notification
    
    # Disputes
    raiseDispute(bookingId: ID!, reason: String!): Dispute!
  }

  type Subscription {
    newMessage(conversationId: ID!): Message!
    bookingStatusChanged(userId: ID!): Booking!
    notificationCreated(userId: ID!): Notification!
    providerLocationUpdated(providerId: ID!): LocationUpdatedPayload!
  }
`;
export default typeDefs;
