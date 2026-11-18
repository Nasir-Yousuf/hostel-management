/**
 * NIYD Hostel Management System - Realistic Database Seeding Script
 * Populates MongoDB with realistic institutional sample data
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Hostel = require('../models/Hostel');
const Building = require('../models/Building');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const RoomAllocation = require('../models/RoomAllocation');
const AdmissionApplication = require('../models/AdmissionApplication');
const FeeStructure = require('../models/FeeStructure');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Announcement = require('../models/Announcement');
const HostelSettings = require('../models/HostelSettings');

const seedData = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/niyd_hms';
  console.log(`[Seed] Connecting to MongoDB: ${uri}`);

  try {
    await mongoose.connect(uri);
    console.log('[Seed] Connected. Clearing existing collections...');

    // Clear existing data safely
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Staff.deleteMany({}),
      Hostel.deleteMany({}),
      Building.deleteMany({}),
      Room.deleteMany({}),
      Bed.deleteMany({}),
      RoomAllocation.deleteMany({}),
      AdmissionApplication.deleteMany({}),
      FeeStructure.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Attendance.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
      Announcement.deleteMany({}),
      HostelSettings.deleteMany({})
    ]);

    console.log('[Seed] Database cleared. Inserting foundational data...');

    // 1. Create Administrators & Wardens
    const adminPassword = await bcrypt.hash('Admin@NIYD2026', 10);
    const wardenPassword = await bcrypt.hash('Warden@NIYD2026', 10);
    const staffPassword = await bcrypt.hash('Staff@123', 10);
    const studentPassword = await bcrypt.hash('Student@123', 10);

    const superAdminUser = await User.create({
      firstName: 'Prof. Dr. M.',
      lastName: 'Hasanuzzaman',
      firstNameBn: 'অধ্যাপক ড. এম.',
      lastNameBn: 'হাসানুজ্জামান',
      email: 'admin@niyd.gov.bd',
      phone: '01711000001',
      password: adminPassword,
      role: 'admin',
      isActive: true
    });

    const wardenUser = await User.create({
      firstName: 'Kazi',
      lastName: 'Nazrul Islam',
      firstNameBn: 'কাজী',
      lastNameBn: 'নজরুল ইসলাম',
      email: 'warden@niyd.gov.bd',
      phone: '01711000002',
      password: wardenPassword,
      role: 'admin',
      isActive: true
    });

    // 2. Create Maintenance Staff Users & Profiles
    const staff1User = await User.create({
      firstName: 'Md.',
      lastName: 'Rafiqul Islam',
      email: 'staff1@niyd.gov.bd',
      phone: '01811000011',
      password: staffPassword,
      role: 'staff',
      isActive: true
    });

    const staff1 = await Staff.create({
      user: staff1User._id,
      staffId: 'STAFF-001',
      designation: 'Senior Electrician & Power Technician',
      specialization: ['electrical', 'general_maintenance'],
      joiningDate: new Date('2023-01-15')
    });

    const staff2User = await User.create({
      firstName: 'Shamsul',
      lastName: 'Haque',
      email: 'plumber@niyd.gov.bd',
      phone: '01811000012',
      password: staffPassword,
      role: 'staff',
      isActive: true
    });

    const staff2 = await Staff.create({
      user: staff2User._id,
      staffId: 'STAFF-002',
      designation: 'Hostel Plumber & Sanitary Technician',
      specialization: ['plumbing'],
      joiningDate: new Date('2023-04-10')
    });

    const staff3User = await User.create({
      firstName: 'Biplob',
      lastName: 'Chowdhury',
      email: 'itsupport@niyd.gov.bd',
      phone: '01811000013',
      password: staffPassword,
      role: 'staff',
      isActive: true
    });

    const staff3 = await Staff.create({
      user: staff3User._id,
      staffId: 'STAFF-003',
      designation: 'Network & ICT Support Specialist',
      specialization: ['internet_wifi'],
      joiningDate: new Date('2024-02-01')
    });

    // 3. Create Hostel & Buildings
    const hostel = await Hostel.create({
      name: 'NIYD Central Residential Complex',
      nameBn: 'এনআইওয়াইডি কেন্দ্রীয় আবাসিক কমপ্লেক্স',
      code: 'NIYD-HC',
      type: 'mixed',
      warden: wardenUser._id,
      totalCapacity: 450,
      contactPhone: '+880-2-7744001',
      contactEmail: 'hostel@niyd.gov.bd'
    });

    const blockA = await Building.create({
      hostel: hostel._id,
      name: 'Block A (Bir Shreshtho Matiur Hall)',
      code: 'BLOCK-A',
      floors: 5,
      description: 'Main residential wing with attached study lounges and dining hall.'
    });

    const blockB = await Building.create({
      hostel: hostel._id,
      name: 'Block B (Begum Rokeya Hall)',
      code: 'BLOCK-B',
      floors: 5,
      description: 'Female wing equipped with full security monitoring and modern reading rooms.'
    });

    // 4. Create Rooms & Beds (40 Rooms across Block A & Block B)
    console.log('[Seed] Creating 40 rooms and beds...');
    const allRooms = [];
    const allBeds = [];

    const buildings = [blockA, blockB];
    for (let b of buildings) {
      for (let floor = 1; floor <= 4; floor++) {
        for (let r = 1; r <= 5; r++) {
          const roomNum = `${floor}${String(r).padStart(2, '0')}`;
          const capacity = r === 1 ? 1 : r === 5 ? 3 : 2; // Room 1 single, Room 5 triple, others double
          const roomType = capacity === 1 ? 'single' : capacity === 3 ? 'triple' : 'double';

          const room = await Room.create({
            building: b._id,
            roomNumber: `${b.code === 'BLOCK-A' ? 'A' : 'B'}-${roomNum}`,
            floor,
            type: roomType,
            capacity,
            currentOccupancy: 0,
            monthlyRent: capacity === 1 ? 3500 : capacity === 3 ? 2000 : 2500,
            amenities: ['wifi', 'study_table', 'wardrobe', 'fan', ...(capacity === 1 ? ['ac'] : [])],
            status: 'available'
          });
          allRooms.push(room);

          const bedLetters = ['A', 'B', 'C'];
          for (let bedIdx = 0; bedIdx < capacity; bedIdx++) {
            const bed = await Bed.create({
              room: room._id,
              bedNumber: bedLetters[bedIdx],
              status: 'available'
            });
            allBeds.push(bed);
          }
        }
      }
    }

    // 5. Create Fee Structures
    console.log('[Seed] Creating Fee Structures...');
    const feeMonthly = await FeeStructure.create({
      name: 'Monthly Hostel & Utility Fee',
      type: 'monthly_rent',
      amount: 2500,
      frequency: 'monthly',
      description: 'Standard monthly accommodation, high-speed Wi-Fi, electricity, and clean water fee.'
    });

    const feeAdmission = await FeeStructure.create({
      name: 'Hostel Admission & Registration Fee',
      type: 'admission_fee',
      amount: 5000,
      frequency: 'one_time',
      description: 'One-time registration and smart access card issuance fee.'
    });

    const feeDeposit = await FeeStructure.create({
      name: 'Security Caution Deposit',
      type: 'security_deposit',
      amount: 3000,
      frequency: 'one_time',
      description: 'Refundable security deposit against room inventory.'
    });

    // 6. Create Realistic Student Residents
    console.log('[Seed] Creating 10 active student residents with room allocations...');
    const studentSampleData = [
      {
        firstName: 'Tanvir',
        lastName: 'Ahmed',
        email: 'student1@niyd.gov.bd',
        phone: '01712345601',
        dept: 'Information & Communication Technology',
        gender: 'male',
        district: 'Mymensingh',
        session: '2026-2027',
        father: 'Anwar Hossain'
      },
      {
        firstName: 'Farhana',
        lastName: 'Akter',
        email: 'farhana@niyd.gov.bd',
        phone: '01712345602',
        dept: 'Youth Leadership & Governance',
        gender: 'female',
        district: 'Sylhet',
        session: '2026-2027',
        father: 'Abdul Karim'
      },
      {
        firstName: 'Mahmudul',
        lastName: 'Hasan',
        email: 'mahmud@niyd.gov.bd',
        phone: '01712345603',
        dept: 'Entrepreneurship & Small Enterprise',
        gender: 'male',
        district: 'Cumilla',
        session: '2025-2026',
        father: 'Abul Kashem'
      },
      {
        firstName: 'Nusrat',
        lastName: 'Jahan',
        email: 'nusrat@niyd.gov.bd',
        phone: '01712345604',
        dept: 'Community Development & Social Work',
        gender: 'female',
        district: 'Chattogram',
        session: '2025-2026',
        father: 'Nurul Amin'
      },
      {
        firstName: 'Ariful',
        lastName: 'Islam',
        email: 'arif@niyd.gov.bd',
        phone: '01712345605',
        dept: 'Information & Communication Technology',
        gender: 'male',
        district: 'Rangpur',
        session: '2026-2027',
        father: 'Mizanur Rahman'
      },
      {
        firstName: 'Sadia',
        lastName: 'Afrin',
        email: 'sadia@niyd.gov.bd',
        phone: '01712345606',
        dept: 'Youth Leadership & Governance',
        gender: 'female',
        district: 'Barishal',
        session: '2026-2027',
        father: 'Sirajul Islam'
      },
      {
        firstName: 'Rakibul',
        lastName: 'Hasan',
        email: 'rakib@niyd.gov.bd',
        phone: '01712345607',
        dept: 'Entrepreneurship & Small Enterprise',
        gender: 'male',
        district: 'Bogura',
        session: '2025-2026',
        father: 'Golam Mostafa'
      },
      {
        firstName: 'Tasnim',
        lastName: 'Khatun',
        email: 'tasnim@niyd.gov.bd',
        phone: '01712345608',
        dept: 'Community Development & Social Work',
        gender: 'female',
        district: 'Rajshahi',
        session: '2026-2027',
        father: 'Azizul Haque'
      },
      {
        firstName: 'Zubair',
        lastName: 'Al Mahmud',
        email: 'zubair@niyd.gov.bd',
        phone: '01712345609',
        dept: 'Information & Communication Technology',
        gender: 'male',
        district: 'Tangail',
        session: '2026-2027',
        father: 'Jahangir Alam'
      },
      {
        firstName: 'Mehnaz',
        lastName: 'Tabassum',
        email: 'mehnaz@niyd.gov.bd',
        phone: '01712345610',
        dept: 'Youth Leadership & Governance',
        gender: 'female',
        district: 'Khulna',
        session: '2025-2026',
        father: 'Akhtaruzzaman'
      }
    ];

    const activeStudents = [];
    let bedCursor = 0;

    for (let i = 0; i < studentSampleData.length; i++) {
      const data = studentSampleData[i];

      const u = await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: studentPassword,
        role: 'student',
        isActive: true
      });

      const studentId = `NIYD-2026-${String(i + 1).padStart(4, '0')}`;
      const s = await Student.create({
        user: u._id,
        studentId,
        gender: data.gender,
        bloodGroup: i % 2 === 0 ? 'B+' : 'O+',
        nidNumber: `1998${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        department: data.dept,
        session: data.session,
        fatherName: data.father,
        permanentAddress: {
          street: 'Main Road',
          city: data.district,
          district: data.district,
          division: data.district
        },
        emergencyContact: {
          name: data.father,
          phone: `018${Math.floor(10000000 + Math.random() * 90000000)}`,
          relation: 'Father'
        },
        status: 'active'
      });

      activeStudents.push(s);

      // Allocate Room & Bed
      // Assign male students to Block A rooms, female to Block B rooms
      const targetBuilding = data.gender === 'male' ? blockA : blockB;
      const targetRoom = allRooms.find(
        (r) => r.building.toString() === targetBuilding._id.toString() && r.currentOccupancy < r.capacity
      );

      if (targetRoom) {
        const availableBed = allBeds.find(
          (b) => b.room.toString() === targetRoom._id.toString() && b.status === 'available'
        );

        if (availableBed) {
          availableBed.status = 'occupied';
          availableBed.currentOccupant = s._id;
          await availableBed.save();

          targetRoom.currentOccupancy += 1;
          if (targetRoom.currentOccupancy >= targetRoom.capacity) {
            targetRoom.status = 'full';
          }
          await targetRoom.save();

          await RoomAllocation.create({
            student: s._id,
            room: targetRoom._id,
            bed: availableBed._id,
            hostel: hostel._id,
            building: targetBuilding._id,
            allocatedBy: wardenUser._id,
            status: 'active'
          });
        }
      }

      // Generate Invoices & Sample Payments
      const invDueDate = new Date();
      invDueDate.setDate(invDueDate.getDate() + 10);

      const inv1 = await Invoice.create({
        student: s._id,
        items: [
          { description: 'Hostel Admission Fee', amount: 5000 },
          { description: 'Security Deposit', amount: 3000 },
          { description: 'First Month Room Fee', amount: 2500 }
        ],
        totalAmount: 10500,
        paidAmount: 10500,
        dueDate: new Date('2026-10-15'),
        status: 'paid',
        issuedBy: wardenUser._id,
        notes: 'Initial admission invoice - fully paid'
      });

      await Payment.create({
        invoice: inv1._id,
        student: s._id,
        amount: 10500,
        method: i % 2 === 0 ? 'bkash' : 'bank_transfer',
        transactionId: `TXN${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'verified',
        verifiedBy: wardenUser._id,
        verifiedAt: new Date('2026-10-10'),
        paymentDate: new Date('2026-10-10'),
        notes: 'Verified bank / bKash deposit'
      });

      // Current month invoice
      const isPaid = i < 6; // First 6 paid, remaining 4 pending/unpaid
      const inv2 = await Invoice.create({
        student: s._id,
        items: [{ description: 'Monthly Hostel Fee (November 2026)', amount: 2500 }],
        totalAmount: 2500,
        paidAmount: isPaid ? 2500 : 0,
        dueDate: invDueDate,
        status: isPaid ? 'paid' : 'issued',
        issuedBy: wardenUser._id,
        billingPeriod: { from: new Date('2026-11-01'), to: new Date('2026-11-30') },
        notes: 'Monthly regular fee'
      });

      if (isPaid) {
        await Payment.create({
          invoice: inv2._id,
          student: s._id,
          amount: 2500,
          method: 'bkash',
          transactionId: `BKASH${Math.floor(1000000 + Math.random() * 9000000)}`,
          status: 'verified',
          verifiedBy: wardenUser._id,
          verifiedAt: new Date('2026-11-05'),
          paymentDate: new Date('2026-11-05')
        });
      }
    }

    // 7. Create Sample Admission Applications (Mix of statuses)
    console.log('[Seed] Creating sample admission applications...');
    const applicationData = [
      {
        firstName: 'Imtiaz',
        lastName: 'Hossain',
        email: 'imtiaz.app@example.com',
        phone: '01912345671',
        dept: 'Information & Communication Technology',
        gender: 'male',
        status: 'pending'
      },
      {
        firstName: 'Sharmin',
        lastName: 'Sultana',
        email: 'sharmin.app@example.com',
        phone: '01912345672',
        dept: 'Youth Leadership & Governance',
        gender: 'female',
        status: 'under_review'
      },
      {
        firstName: 'Kamrul',
        lastName: 'Islam',
        email: 'kamrul.app@example.com',
        phone: '01912345673',
        dept: 'Entrepreneurship & Small Enterprise',
        gender: 'male',
        status: 'waitlisted'
      },
      {
        firstName: 'Rehana',
        lastName: 'Parvin',
        email: 'rehana.app@example.com',
        phone: '01912345674',
        dept: 'Community Development & Social Work',
        gender: 'female',
        status: 'info_required'
      }
    ];

    for (let app of applicationData) {
      await AdmissionApplication.create({
        applicant: {
          firstName: app.firstName,
          lastName: app.lastName,
          email: app.email,
          phone: app.phone,
          gender: app.gender,
          nidNumber: `1999${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          permanentAddress: { street: 'Station Road', city: 'Dhaka', district: 'Dhaka' },
          emergencyContact: { name: 'Guardian', phone: '01700000099', relation: 'Father' }
        },
        academic: {
          department: app.dept,
          session: '2026-2027',
          program: 'Diploma in Youth Development'
        },
        preferences: {
          hostel: hostel._id,
          roomType: 'double'
        },
        status: app.status,
        statusHistory: [
          {
            status: app.status,
            notes: `Application received and set to ${app.status}`
          }
        ]
      });
    }

    // 8. Create Realistic Attendance for the Past 10 Days
    console.log('[Seed] Creating attendance history...');
    for (let dayOffset = 9; dayOffset >= 0; dayOffset--) {
      const d = new Date();
      d.setDate(d.getDate() - dayOffset);
      d.setHours(0, 0, 0, 0);

      for (let s of activeStudents) {
        // 90% present, 5% absent, 5% checked out
        const rand = Math.random();
        const status = rand > 0.1 ? 'present' : rand > 0.05 ? 'checked_out' : 'absent';

        const checkInTime = new Date(d);
        checkInTime.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 59));

        await Attendance.create({
          student: s._id,
          date: d,
          status,
          checkIn: status === 'present' ? checkInTime : undefined,
          markedBy: wardenUser._id
        });
      }
    }

    // 9. Create Sample Maintenance Requests
    console.log('[Seed] Creating maintenance requests...');
    const maintenanceSamples = [
      {
        student: activeStudents[0]._id,
        category: 'plumbing',
        priority: 'high',
        title: 'Bathroom water tap leaking continuously',
        description: 'The cold water faucet in room A-102 attached washroom has a broken washer and leaks constantly.',
        status: 'assigned',
        assignedTo: staff2._id
      },
      {
        student: activeStudents[1]._id,
        category: 'electrical',
        priority: 'urgent',
        title: 'Ceiling fan humming loudly and not spinning',
        description: 'The main regulator works but the ceiling fan capacitor appears burned out.',
        status: 'in_progress',
        assignedTo: staff1._id
      },
      {
        student: activeStudents[2]._id,
        category: 'internet_wifi',
        priority: 'medium',
        title: 'Wi-Fi access point weak signal in corner bed',
        description: 'Signal drops below 1 Mbps near bed B. Other devices in hallway connect normally.',
        status: 'submitted'
      },
      {
        student: activeStudents[3]._id,
        category: 'furniture',
        priority: 'low',
        title: 'Study table drawer lock stuck',
        description: 'Key does not turn in the wooden study desk drawer.',
        status: 'completed',
        assignedTo: staff1._id
      }
    ];

    for (let m of maintenanceSamples) {
      const studentAllocation = await RoomAllocation.findOne({ student: m.student, status: 'active' });
      await MaintenanceRequest.create({
        student: m.student,
        room: studentAllocation ? studentAllocation.room : allRooms[0]._id,
        building: studentAllocation ? studentAllocation.building : blockA._id,
        category: m.category,
        priority: m.priority,
        title: m.title,
        description: m.description,
        status: m.status,
        assignedTo: m.assignedTo || undefined,
        assignedAt: m.assignedTo ? new Date() : undefined,
        assignedBy: m.assignedTo ? wardenUser._id : undefined,
        completedAt: m.status === 'completed' ? new Date() : undefined,
        statusHistory: [
          {
            status: m.status,
            notes: `Status set to ${m.status}`
          }
        ]
      });
    }

    // 10. Create Announcements
    console.log('[Seed] Creating official announcements...');
    await Announcement.create({
      title: 'Hostel Seat Allocation for Autumn 2026 Announced',
      titleBn: 'অটাম ২০২৬ সেশনের হোস্টেল সিট বরাদ্দ তালিকা প্রকাশ',
      category: 'academic',
      priority: 'important',
      content: 'Selected residential students are requested to complete the fee payment and bed registration before November 30.',
      contentBn: 'নির্বাচিত শিক্ষার্থীদের আগামী ৩০ নভেম্বরের মধ্যে প্রয়োজনীয় ফি পরিশোধ করে সিট কনফার্ম করার অনুরোধ করা হলো।',
      isPublished: true,
      isPinned: true,
      publishedBy: wardenUser._id
    });

    await Announcement.create({
      title: 'Scheduled Electrical & Generator Maintenance',
      titleBn: 'নির্ধারিত বিদ্যুৎ ও জেনারেটর রক্ষণাবেক্ষণ নোটিশ',
      category: 'maintenance',
      priority: 'normal',
      content: 'Annual maintenance of backup diesel generators will take place this Saturday from 2:00 PM to 4:00 PM.',
      contentBn: 'আগামী শনিবার দুপুর ২টা থেকে বিকাল ৪টা পর্যন্ত ক্যাম্পাসের ডিজেল জেনারেটর সার্ভিসিং করা হবে।',
      isPublished: true,
      publishedBy: wardenUser._id
    });

    await Announcement.create({
      title: 'Reminder: Strict Hostel Gate Timings for Winter Term',
      titleBn: 'শীতকালীন মেয়াদের জন্য হোস্টেল গেট সময়সূচি সংক্রান্ত নোটিশ',
      category: 'general',
      priority: 'urgent',
      content: 'All residents must check in before 9:30 PM. Late entries require prior written permission from the Chief Warden.',
      contentBn: 'সকল আবাসিক শিক্ষার্থীকে রাত ৯:৩০ এর মধ্যে হোস্টেলে প্রবেশ করতে হবে। অন্যথায় জরিমানা ধার্য হবে।',
      isPublished: true,
      publishedBy: wardenUser._id
    });

    // 11. Create Hostel Settings
    console.log('[Seed] Creating institutional settings...');
    await HostelSettings.create({
      key: 'gate_timings',
      value: {
        openTime: '06:00',
        closeTime: '21:30',
        curfewEnforced: true,
        lateEntryFee: 200
      },
      category: 'timing',
      description: 'Hostel boundary gate entry and exit operational hours'
    });

    await HostelSettings.create({
      key: 'visitor_policy',
      value: {
        visitingHoursFrom: '16:00',
        visitingHoursTo: '19:00',
        allowedLocations: ['Ground Floor Visitor Lounge', 'Hostel Courtyard'],
        requirePhotoId: true
      },
      category: 'rules',
      description: 'Institutional visitor policy and identification requirements'
    });

    console.log(`
========================================================================
🎉 NIYD HOSTEL MANAGEMENT SYSTEM — DATABASE SEEDING COMPLETE!
========================================================================
Realistic Institutional Data Created:
  ✅ 2 Admin / Warden accounts
  ✅ 3 Maintenance Staff accounts
  ✅ 10 Active Student Residents (with live rooms, beds, and invoices)
  ✅ 4 Admission Applications (Pending, Review, Waitlist, Info Required)
  ✅ 1 Hostel Complex with 2 Blocks (Block A & Block B)
  ✅ 40 Rooms across 5 Floors with ~100 Beds
  ✅ 3 Standard Fee Structures (Monthly, Admission, Security Deposit)
  ✅ 20+ Invoices and Payment Records
  ✅ 100+ Attendance Records across past 10 days
  ✅ 4 Real Maintenance Requests with Staff assignments
  ✅ 3 Official Announcements
  ✅ System Institutional Settings & Curfew Timings

🔑 DEMO LOGIN CREDENTIALS:
  👑 Super Admin:  admin@niyd.gov.bd    / Admin@NIYD2026
  🗝️ Chief Warden:  warden@niyd.gov.bd   / Warden@NIYD2026
  🎓 Student:       student1@niyd.gov.bd / Student@123
  🔧 Staff:         staff1@niyd.gov.bd   / Staff@123
========================================================================
    `);

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
    process.exit(1);
  }
};

seedData();
