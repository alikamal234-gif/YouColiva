import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Listing } from '../models/listing.model.js';
import { RoommatePost } from '../models/roommate-post.model.js';
import { Notification } from '../models/notification.model.js';
import { hashPassword } from '../utils/crypto.js';
import { env } from '../config/env.js';

export async function seedDatabase() {
  console.log(`Connecting to MongoDB at: ${env.MONGODB_URI}...`);
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected successfully.');

  // Clear existing demo data
  await User.deleteMany({ email: { $regex: /@youcode\.ma$/ } });
  await Listing.deleteMany({});
  await RoommatePost.deleteMany({});
  console.log('Cleared previous demo data.');

  const defaultPasswordHash = await hashPassword('Password123!');

  // 1. Create demo users for all 4 roles
  const student = await User.create({
    email: 'etudiant@youcode.ma',
    passwordHash: defaultPasswordHash,
    firstName: 'Amine',
    lastName: 'El Mansouri',
    role: 'STUDENT',
    campus: 'YOUSSOUFIA',
    phone: '0611223344',
    isEmailVerified: true,
    isVerified: true,
    bio: 'Apprenant YouCode promo 2026, passionné par le web et React.',
  });

  const landlord = await User.create({
    email: 'bailleur@youcode.ma',
    passwordHash: defaultPasswordHash,
    firstName: 'Hassan',
    lastName: 'Benkirane',
    role: 'LANDLORD',
    campus: 'SAFI',
    phone: '0622334455',
    isEmailVerified: true,
    isVerified: true,
    bio: 'Propriétaire de plusieurs logements meublés à Safi adaptés aux étudiants.',
  });

  const agent = await User.create({
    email: 'agent@youcode.ma',
    passwordHash: defaultPasswordHash,
    firstName: 'Fatima',
    lastName: 'Zahra',
    role: 'AGENT',
    campus: 'NADOR',
    phone: '0633445566',
    isEmailVerified: true,
    isVerified: true,
    agencyName: 'Nador Horizon Immo',
    agencyFeeDetails: '1 mois de loyer hors charges en toute transparence.',
    bio: 'Conseillère immobilière spécialisée dans la colocation étudiante à Nador.',
  });

  await User.create({
    email: 'admin@youcode.ma',
    passwordHash: defaultPasswordHash,
    firstName: 'Khadija',
    lastName: 'Directrice',
    role: 'ADMIN',
    campus: 'YOUSSOUFIA',
    phone: '0644556677',
    isEmailVerified: true,
    isVerified: true,
    bio: 'Équipe administrative YouColiva.',
  });

  console.log('Created 4 demo accounts:');
  console.log('  - Student:  etudiant@youcode.ma  | Password123!');
  console.log('  - Landlord: bailleur@youcode.ma  | Password123!');
  console.log('  - Agent:    agent@youcode.ma     | Password123!');
  console.log('  - Admin:    admin@youcode.ma     | Password123!');

  // 2. Create demo listings across the 3 campuses
  const listingYoussoufia = await Listing.create({
    owner: landlord._id,
    title: 'Studio meublé et lumineux à 5 min de YouCode Youssoufia',
    description: 'Charmant studio équipé avec fibre optique, bureau de travail, cuisine séparée et salle de bain privative. Emplacement idéal pour les apprenants YouCode.',
    campus: 'YOUSSOUFIA',
    neighborhood: 'Al Qods',
    location: {
      type: 'Point',
      coordinates: [-8.5294, 32.2464],
    },
    exactAddress: '15 Boulevard Mohammed V, Étage 2, Apt 4',
    pricePerMonth: 1200,
    propertyType: 'STUDIO',
    roomCount: 1,
    bathroomCount: 1,
    maxCapacity: 1,
    availablePlaces: 1,
    furnished: true,
    amenities: ['Fibre Optique', 'Bureau', 'Machine à laver', 'Chauffe-eau'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    availableFrom: new Date(),
  });

  const listingSafi = await Listing.create({
    owner: landlord._id,
    title: 'Grand appartement F4 en colocation étudiante proche YouCode Safi',
    description: 'Appartement spacieux tout équipé, grand salon marocain partagé, 3 chambres individuelles calmes et cuisine complète. Vue dégagée sur la ville.',
    campus: 'SAFI',
    neighborhood: 'Plateau',
    location: {
      type: 'Point',
      coordinates: [-9.2372, 32.2994],
    },
    exactAddress: '42 Avenue de la Liberté, Résidence Al Manar',
    pricePerMonth: 800,
    propertyType: 'APARTMENT',
    roomCount: 3,
    bathroomCount: 2,
    maxCapacity: 3,
    availablePlaces: 2,
    furnished: true,
    amenities: ['WiFi Haut Débit', 'Cuisine équipée', 'Balcon', 'Machine à laver'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    availableFrom: new Date(),
  });

  const listingNador = await Listing.create({
    owner: agent._id,
    title: 'Chambre moderne dans résidence neuve YouCode Nador',
    description: 'Chambre individuelle moderne avec literie neuve, dressing, bureau pour coder. Espace commun convivial avec salon et terrasse.',
    campus: 'NADOR',
    neighborhood: 'Nouveau Nador',
    location: {
      type: 'Point',
      coordinates: [-2.9335, 35.1688],
    },
    exactAddress: '78 Rue Hassan II, Résidence Méditerranée',
    pricePerMonth: 1100,
    propertyType: 'ROOM',
    roomCount: 1,
    bathroomCount: 1,
    maxCapacity: 1,
    availablePlaces: 1,
    furnished: true,
    amenities: ['WiFi', 'Terrasse', 'Ascenseur', 'Sécurité 24/7'],
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    availableFrom: new Date(),
  });

  console.log(`Created 3 verified listings:`);
  console.log(`  - Youssoufia: ${listingYoussoufia.id}`);
  console.log(`  - Safi:       ${listingSafi.id}`);
  console.log(`  - Nador:      ${listingNador.id}`);

  // 3. Create demo roommate posts
  await RoommatePost.create({
    author: student._id,
    title: 'Recherche 2 colocataires sérieux pour maison avec jardin à Youssoufia',
    description: 'Salut les codeurs ! Je suis apprenant promo 2026 en dev web. Je cherche 2 colocataires respectueux et calmes pour partager les frais et coder ensemble.',
    campus: 'YOUSSOUFIA',
    budgetMax: 900,
    targetMoveInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    preferredRoommateGender: 'ANY',
    status: 'OPEN',
    lifestyleHabits: ['Non-fumeur', 'Calme le soir', 'Passionné de tech'],
  });

  await RoommatePost.create({
    author: student._id,
    title: 'Colocation Safi - Chambre disponible immédiatement',
    description: 'Chambre disponible dans notre colocation de 3 apprenants YouCode Safi. Ambiance studieuse et conviviale.',
    campus: 'SAFI',
    budgetMax: 750,
    targetMoveInDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    preferredRoommateGender: 'MALE',
    status: 'OPEN',
    lifestyleHabits: ['Études sérieuses', 'Partage des tâches'],
  });

  console.log('Created 2 demo roommate posts.');

  // 4. Create demo notifications for student (12 notifications to test pagination and Show More)
  await Notification.deleteMany({});
  const now = Date.now();
  const demoNotifs = [
    {
      user: student._id,
      title: 'Nouveau logement disponible',
      message: 'Studio meublé et lumineux à 5 min de YouCode Youssoufia (1 200 MAD)',
      type: 'NEW_LISTING',
      link: `/listings/${listingYoussoufia._id}`,
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 5), // 5 min ago
    },
    {
      user: student._id,
      title: 'Nouveau message reçu',
      message: 'Hassan Benkirane : "Bonjour Amine, le studio est disponible pour une visite demain."',
      type: 'NEW_MESSAGE',
      link: '/messages',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 25), // 25 min ago
    },
    {
      user: student._id,
      title: 'Nouvelle recherche de colocataire',
      message: 'Colocation Safi - Chambre disponible immédiatement pour apprenant YouCode',
      type: 'NEW_ROOMMATE_POST',
      link: '/roommates',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 2), // 2h ago
    },
    {
      user: student._id,
      title: 'Bienvenue sur YouColiva',
      message: 'Votre profil étudiant YouCode a été vérifié avec succès.',
      type: 'GENERAL',
      link: '/profile',
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 6), // 6h ago
    },
    {
      user: student._id,
      title: 'Nouveau logement disponible',
      message: 'Grand appartement F4 en colocation étudiante proche YouCode Safi',
      type: 'NEW_LISTING',
      link: `/listings/${listingSafi._id}`,
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 12),
    },
    {
      user: student._id,
      title: 'Nouveau logement disponible',
      message: 'Chambre moderne dans résidence neuve YouCode Nador',
      type: 'NEW_LISTING',
      link: `/listings/${listingNador._id}`,
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 24),
    },
    {
      user: student._id,
      title: 'Conseil de sécurité',
      message: 'Ne versez aucun acompte avant d\'avoir visité le logement et signé un bail régulier.',
      type: 'GENERAL',
      link: '/legal/terms',
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 36),
    },
    {
      user: student._id,
      title: 'Nouveau message reçu',
      message: 'Fatima Zahra : "Les charges WiFi et eau sont incluses dans le loyer."',
      type: 'NEW_MESSAGE',
      link: '/messages',
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 48),
    },
    {
      user: student._id,
      title: 'Annonce mise à jour',
      message: 'Le prix de la colocation Safi a été réajusté à 800 MAD / mois.',
      type: 'NEW_LISTING',
      link: `/listings/${listingSafi._id}`,
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 60),
    },
    {
      user: student._id,
      title: 'Recherche de colocataires active',
      message: 'Nouveau post pour maison avec jardin à Youssoufia.',
      type: 'NEW_ROOMMATE_POST',
      link: '/roommates',
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 72),
    },
    {
      user: student._id,
      title: 'Rappel rentrée YouCode',
      message: 'Les sessions de rentrée approchent : pensez à finaliser votre réservation.',
      type: 'GENERAL',
      link: '/listings',
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 96),
    },
    {
      user: student._id,
      title: 'Bienvenue dans la communauté',
      message: 'Consultez la charte de respect mutuel et de convivialité YouColiva.',
      type: 'GENERAL',
      link: '/legal/terms',
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 120),
    },
  ];

  await Notification.insertMany(demoNotifs);
  console.log(`Created ${demoNotifs.length} demo notifications for student.`);

  console.log('Database seed complete!');
  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
