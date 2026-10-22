import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp, type AppInstance } from '../server.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

describe('YouColiva API - Complete Domain & Security Features', () => {
  let mongoServer: MongoMemoryServer;
  let appInstance: AppInstance;

  // Track auth tokens for different actors
  let studentToken: string;
  let studentId: string;
  let landlordToken: string;
  let landlordId: string;
  let adminToken: string;
  let intruderToken: string;

  // Track created resources
  let listingId: string;
  let roommatePostId: string;
  let conversationId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await connectDatabase(uri);
    appInstance = await createApp();
  });

  afterAll(async () => {
    if (appInstance?.io) {
      appInstance.io.close();
    }
    if (appInstance?.apolloServer) {
      await appInstance.apolloServer.stop();
    }
    if (appInstance?.httpServer.listening) {
      await new Promise<void>((resolve) => {
        appInstance.httpServer.close(() => resolve());
      });
    }

    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // ============================================================================
  // 1. AUTHENTICATION & ACCESS CONTROL (Milestone C)
  // ============================================================================
  describe('Milestone C: Authentication & Access Control', () => {
    it('should register a new student user with normalized email and hashed password', async () => {
      const mutation = `
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            accessToken
            refreshToken
            user {
              id
              email
              role
              campus
              firstName
              lastName
              isEmailVerified
            }
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              email: '  STUDENT.Youssoufia@YouCode.ma  ',
              password: 'SecurePassword123!',
              firstName: 'Amine',
              lastName: 'El Idrissi',
              role: 'STUDENT',
              campus: 'YOUSSOUFIA',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const data = response.body.data.register;
      expect(data.accessToken).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      expect(data.user.email).toBe('student.youssoufia@youcode.ma'); // Lowercased and trimmed
      expect(data.user.role).toBe('STUDENT');
      expect(data.user.campus).toBe('YOUSSOUFIA');

      studentToken = data.accessToken;
      studentId = data.user.id;
    });

    it('should register a landlord and an admin user', async () => {
      const mutation = `
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            accessToken
            user { id role }
          }
        }
      `;

      // Register Landlord
      const landlordRes = await request(appInstance.app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              email: 'landlord@safi.ma',
              password: 'LandlordPass123!',
              firstName: 'Hassan',
              lastName: 'Alami',
              role: 'LANDLORD',
              campus: 'SAFI',
            },
          },
        })
        .expect(200);

      landlordToken = landlordRes.body.data.register.accessToken;
      landlordId = landlordRes.body.data.register.user.id;

      // Register Admin
      const adminRes = await request(appInstance.app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              email: 'admin@youcode.ma',
              password: 'AdminPassword123!',
              firstName: 'Super',
              lastName: 'Admin',
              role: 'ADMIN',
              campus: 'YOUSSOUFIA',
            },
          },
        })
        .expect(200);

      adminToken = adminRes.body.data.register.accessToken;

      // Register an intruder student
      const intruderRes = await request(appInstance.app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              email: 'intruder@other.ma',
              password: 'IntruderPass123!',
              firstName: 'Other',
              lastName: 'User',
              role: 'STUDENT',
              campus: 'NADOR',
            },
          },
        })
        .expect(200);

      intruderToken = intruderRes.body.data.register.accessToken;
    });

    it('should reject login with wrong password without disclosing email validity', async () => {
      const mutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            accessToken
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              email: 'student.youssoufia@youcode.ma',
              password: 'WrongPassword!',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Invalid email or password');
    });

    it('should return authenticated user profile via query { me }', async () => {
      const query = `
        query {
          me {
            id
            email
            firstName
            role
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.me.id).toBe(studentId);
      expect(response.body.data.me.email).toBe('student.youssoufia@youcode.ma');
    });
  });

  // ============================================================================
  // 2. HOUSING LISTINGS & GEOSPATIAL SEARCH (Milestone D)
  // ============================================================================
  describe('Milestone D: Listings, Search & Address Privacy', () => {
    it('should forbid student from creating a listing (role restriction)', async () => {
      const mutation = `
        mutation CreateListing($input: CreateListingInput!) {
          createListing(input: $input) { id }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          query: mutation,
          variables: {
            input: {
              title: 'Unauthorized listing',
              description: 'Student attempting landlord action',
              campus: 'YOUSSOUFIA',
              neighborhood: 'Al Qods',
              longitude: -8.532,
              latitude: 32.246,
              exactAddress: 'Secret Apartment 12',
              pricePerMonth: 1500,
              propertyType: 'APARTMENT',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Only landlords, agents or admins');
    });

    it('should allow landlord to create a listing', async () => {
      const mutation = `
        mutation CreateListing($input: CreateListingInput!) {
          createListing(input: $input) {
            id
            title
            campus
            neighborhood
            pricePerMonth
            propertyType
            exactAddress
            location { longitude latitude }
            status
            moderationStatus
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          query: mutation,
          variables: {
            input: {
              title: 'Chambre meublée proche du campus YouCode',
              description: 'Colocation calme et équipée avec WiFi haut débit',
              campus: 'SAFI',
              neighborhood: 'Plateau',
              longitude: -9.237,
              latitude: 32.299,
              exactAddress: '42 Rue Ibn Khaldoun, Safi, Étage 3, Appt 5',
              pricePerMonth: 1200,
              propertyType: 'ROOM',
              furnished: true,
              amenities: ['WiFi', 'Machine à laver', 'Bureau'],
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const listing = response.body.data.createListing;
      expect(listing.id).toBeDefined();
      expect(listing.campus).toBe('SAFI');
      expect(listing.pricePerMonth).toBe(1200);
      expect(listing.exactAddress).toBe('42 Rue Ibn Khaldoun, Safi, Étage 3, Appt 5');

      listingId = listing.id;
    });

    it('should allow admin to approve and publish the listing', async () => {
      const mutation = `
        mutation Moderate($id: ID!, $status: ModerationStatus!, $reason: String) {
          moderateListing(id: $id, status: $status, reason: $reason) {
            id
            status
            moderationStatus
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: mutation,
          variables: {
            id: listingId,
            status: 'APPROVED',
            reason: 'Listing verified and meets student housing standards',
          },
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.moderateListing.status).toBe('PUBLISHED');
      expect(response.body.data.moderateListing.moderationStatus).toBe('APPROVED');
    });

    it('should conceal exact address from student visitors while showing approximate location', async () => {
      const query = `
        query GetListing($id: ID!) {
          listing(id: $id) {
            id
            title
            neighborhood
            exactAddress
            location { longitude latitude }
          }
        }
      `;

      // Student views listing
      const response = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query, variables: { id: listingId } })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const listing = response.body.data.listing;
      expect(listing.location.longitude).toBe(-9.237);
      expect(listing.location.latitude).toBe(32.299);
      // Privacy rule enforced:
      expect(listing.exactAddress).toBeNull();
    });

    it('should find published listings using geospatial and campus filters', async () => {
      const query = `
        query SearchListings($filter: ListingFilterInput) {
          listings(filter: $filter) {
            total
            items {
              id
              title
              campus
              pricePerMonth
            }
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .send({
          query,
          variables: {
            filter: {
              campus: 'SAFI',
              priceMax: 1500,
              near: {
                longitude: -9.237,
                latitude: 32.299,
                maxDistanceMeters: 5000,
              },
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.listings.total).toBe(1);
      expect(response.body.data.listings.items[0].id).toBe(listingId);
    });
  });

  // ============================================================================
  // 3. ROOMMATE SEARCH POSTS (Milestone E)
  // ============================================================================
  describe('Milestone E: Roommate Posts', () => {
    it('should allow student to create a roommate post', async () => {
      const mutation = `
        mutation CreateRoommatePost($input: CreateRoommatePostInput!) {
          createRoommatePost(input: $input) {
            id
            title
            campus
            budgetMax
            status
            lifestyleHabits
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          query: mutation,
          variables: {
            input: {
              title: 'Cherche colocataire sérieux à Youssoufia promo 2026',
              description: 'Apprenant YouCode en développement web cherche colocation calme',
              campus: 'YOUSSOUFIA',
              budgetMax: 900,
              targetMoveInDate: '2026-11-01T00:00:00.000Z',
              preferredRoommateGender: 'ANY',
              lifestyleHabits: ['Calme', 'Non-fumeur', 'Travailleur'],
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const post = response.body.data.createRoommatePost;
      expect(post.id).toBeDefined();
      expect(post.campus).toBe('YOUSSOUFIA');
      expect(post.status).toBe('OPEN');

      roommatePostId = post.id;
    });

    it('should filter roommate posts by campus and budget', async () => {
      const query = `
        query GetRoommatePosts($filter: RoommatePostFilterInput) {
          roommatePosts(filter: $filter) {
            total
            items { id title budgetMax }
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .send({
          query,
          variables: {
            filter: {
              campus: 'YOUSSOUFIA',
              budgetMax: 1000,
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.roommatePosts.total).toBe(1);
      expect(response.body.data.roommatePosts.items[0].id).toBe(roommatePostId);
    });
  });

  // ============================================================================
  // 4. CHAT, FAVORITES & REPORTS (Milestone F)
  // ============================================================================
  describe('Milestone F: Conversations, Real-Time Messaging & Reports', () => {
    it('should start conversation between student and landlord regarding listing', async () => {
      const mutation = `
        mutation StartChat($recipientId: ID!, $listingId: ID) {
          getOrCreateConversation(recipientId: $recipientId, listingId: $listingId) {
            id
            participants { id firstName }
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          query: mutation,
          variables: {
            recipientId: landlordId,
            listingId,
          },
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      conversationId = response.body.data.getOrCreateConversation.id;
      expect(conversationId).toBeDefined();
    });

    it('should allow student to send a message in the conversation', async () => {
      const mutation = `
        mutation SendMsg($conversationId: ID!, $content: String!) {
          sendMessage(conversationId: $conversationId, content: $content) {
            id
            content
            sender { id firstName }
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          query: mutation,
          variables: {
            conversationId,
            content: 'Bonjour, la chambre est-elle toujours disponible pour le campus de Safi ?',
          },
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.sendMessage.content).toContain('toujours disponible');
    });

    it('should forbid unauthorized user from viewing messages in another user conversation', async () => {
      const query = `
        query GetMessages($conversationId: ID!) {
          conversationMessages(conversationId: $conversationId) {
            items { id content }
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${intruderToken}`) // Non-participant user
        .send({
          query,
          variables: { conversationId },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('not authorized to view messages');
    });

    it('should allow student to toggle favorite on listing', async () => {
      const mutation = `
        mutation Fav($listingId: ID!) {
          toggleFavorite(listingId: $listingId) {
            favorited
          }
        }
      `;

      // 1. Add to favorites
      const addRes = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: mutation, variables: { listingId } })
        .expect(200);

      expect(addRes.body.data.toggleFavorite.favorited).toBe(true);

      // 2. Query myFavorites
      const listRes = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          query: `query { myFavorites { id listing { id title } } }`,
        })
        .expect(200);

      expect(listRes.body.data.myFavorites.length).toBe(1);
      expect(listRes.body.data.myFavorites[0].listing.id).toBe(listingId);
    });

    it('should allow student to file a report and admin to resolve it', async () => {
      // 1. File report
      const reportRes = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          query: `
            mutation Report($input: CreateReportInput!) {
              createReport(input: $input) {
                id
                reason
                status
              }
            }
          `,
          variables: {
            input: {
              targetType: 'LISTING',
              targetId: listingId,
              reason: 'Information vérifiée correcte',
              details: 'Rien à signaler',
            },
          },
        })
        .expect(200);

      const repId = reportRes.body.data.createReport.id;
      expect(repId).toBeDefined();

      // 2. Admin resolves report
      const resolveRes = await request(appInstance.app)
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `
            mutation Resolve($id: ID!, $status: ReportStatus!, $action: String!) {
              resolveReport(id: $id, status: $status, actionTaken: $action) {
                id
                status
                actionTaken
              }
            }
          `,
          variables: {
            id: repId,
            status: 'RESOLVED',
            action: 'Reviewed and closed',
          },
        })
        .expect(200);

      expect(resolveRes.body.data.resolveReport.status).toBe('RESOLVED');
    });
  });
});
