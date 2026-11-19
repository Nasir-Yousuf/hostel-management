/**
 * NIYD Hostel Management System - Mock Database & Local Storage Store
 * Provides full offline client-side database simulation for Admin, Student, and Staff portals on Vercel
 */

const MockDB = (function() {
  const STORAGE_PREFIX = 'niyd_mock_db_';

  // Seed data
  const initialData = {
    users: [
      {
        id: 'u-admin-1',
        firstName: 'Prof. Dr. M.',
        lastName: 'Hasanuzzaman',
        email: 'admin@niyd.gov.bd',
        phone: '01711000001',
        password: 'Admin@NIYD2026',
        role: 'admin',
        designation: 'Hostel Director & Chief Administrator',
        department: 'Administration'
      },
      {
        id: 'u-warden-1',
        firstName: 'Kazi',
        lastName: 'Nazrul Islam',
        email: 'warden@niyd.gov.bd',
        phone: '01711000002',
        password: 'Warden@NIYD2026',
        role: 'admin',
        designation: 'Residential Hall Warden',
        department: 'Hall Administration'
      },
      {
        id: 'u-student-1',
        firstName: 'Tanvir',
        lastName: 'Ahmed',
        email: 'student1@niyd.gov.bd',
        phone: '01819000001',
        password: 'Student@123',
        role: 'student',
        studentId: 'NIYD-2026-001',
        department: 'Computer Science & Technology',
        session: '2024-2026',
        guardianName: 'Abdul Karim',
        guardianPhone: '01819000099',
        address: 'Savar, Dhaka'
      },
      {
        id: 'u-student-2',
        firstName: 'Farhana',
        lastName: 'Akter',
        email: 'farhana@niyd.gov.bd',
        phone: '01819000002',
        password: 'Student@123',
        role: 'student',
        studentId: 'NIYD-2026-002',
        department: 'Apparel & Fashion Design',
        session: '2024-2026',
        guardianName: 'Rafiqul Islam',
        guardianPhone: '01819000098',
        address: 'Mirpur, Dhaka'
      },
      {
        id: 'u-student-3',
        firstName: 'Md. Raihan',
        lastName: 'Kabir',
        email: 'raihan@niyd.gov.bd',
        phone: '01819000003',
        password: 'Student@123',
        role: 'student',
        studentId: 'NIYD-2026-003',
        department: 'Electrical & Electronics',
        session: '2025-2027',
        guardianName: 'Kabir Hossain',
        guardianPhone: '01819000097',
        address: 'Gazipur'
      },
      {
        id: 'u-staff-1',
        firstName: 'Md.',
        lastName: 'Rafiqul Islam',
        email: 'staff1@niyd.gov.bd',
        phone: '01811000011',
        password: 'Staff@123',
        role: 'staff',
        staffId: 'STAFF-001',
        designation: 'Senior Electrician & Power Technician',
        department: 'Electrical Maintenance'
      }
    ],

    buildings: [
      { _id: 'b-1', name: 'Shaheed Dr. Fazle Rabbi Hall (Block A)', gender: 'male', totalFloors: 4, totalRooms: 40 },
      { _id: 'b-2', name: 'Begum Rokeya Residential Hall (Block B)', gender: 'female', totalFloors: 3, totalRooms: 30 },
      { _id: 'b-3', name: 'Youth Vocational Training Block (Block C)', gender: 'male', totalFloors: 3, totalRooms: 24 }
    ],

    rooms: [
      { _id: 'r-101', roomNumber: '101', building: { _id: 'b-1', name: 'Block A' }, floor: 1, capacity: 2, currentOccupancy: 2, type: 'double', rent: 2500, status: 'occupied', amenities: ['Wi-Fi', 'Study Table', 'Attached Bathroom'] },
      { _id: 'r-102', roomNumber: '102', building: { _id: 'b-1', name: 'Block A' }, floor: 1, capacity: 3, currentOccupancy: 2, type: 'triple', rent: 2000, status: 'available', amenities: ['Wi-Fi', 'Ceiling Fan'] },
      { _id: 'r-103', roomNumber: '103', building: { _id: 'b-1', name: 'Block A' }, floor: 1, capacity: 2, currentOccupancy: 1, type: 'double', rent: 2500, status: 'available', amenities: ['Wi-Fi', 'Study Table', 'Balcony'] },
      { _id: 'r-201', roomNumber: '201', building: { _id: 'b-2', name: 'Block B' }, floor: 2, capacity: 2, currentOccupancy: 1, type: 'double', rent: 2500, status: 'available', amenities: ['Wi-Fi', 'Study Table', 'AC'] },
      { _id: 'r-202', roomNumber: '202', building: { _id: 'b-2', name: 'Block B' }, floor: 2, capacity: 3, currentOccupancy: 3, type: 'triple', rent: 2000, status: 'occupied', amenities: ['Wi-Fi', 'Balcony'] },
      { _id: 'r-301', roomNumber: '301', building: { _id: 'b-3', name: 'Block C' }, floor: 3, capacity: 1, currentOccupancy: 0, type: 'single', rent: 4000, status: 'available', amenities: ['Wi-Fi', 'Attached Bathroom', 'AC', 'Study Table'] }
    ],

    students: [
      {
        _id: 'std-1',
        user: { _id: 'u-student-1', firstName: 'Tanvir', lastName: 'Ahmed', email: 'student1@niyd.gov.bd', phone: '01819000001' },
        studentId: 'NIYD-2026-001',
        department: 'Computer Science & Technology',
        session: '2024-2026',
        roomNumber: '101',
        bedNumber: 'A',
        buildingName: 'Block A',
        status: 'active',
        nid: '19982691234567890',
        address: 'Savar, Dhaka',
        emergencyName: 'Abdul Karim',
        emergencyPhone: '01819000099'
      },
      {
        _id: 'std-2',
        user: { _id: 'u-student-2', firstName: 'Farhana', lastName: 'Akter', email: 'farhana@niyd.gov.bd', phone: '01819000002' },
        studentId: 'NIYD-2026-002',
        department: 'Apparel & Fashion Design',
        session: '2024-2026',
        roomNumber: '201',
        bedNumber: 'A',
        buildingName: 'Block B',
        status: 'active',
        nid: '20012691234567891',
        address: 'Mirpur, Dhaka',
        emergencyName: 'Rafiqul Islam',
        emergencyPhone: '01819000098'
      },
      {
        _id: 'std-3',
        user: { _id: 'u-student-3', firstName: 'Md. Raihan', lastName: 'Kabir', email: 'raihan@niyd.gov.bd', phone: '01819000003' },
        studentId: 'NIYD-2026-003',
        department: 'Electrical & Electronics',
        session: '2025-2027',
        roomNumber: '102',
        bedNumber: 'B',
        buildingName: 'Block A',
        status: 'active',
        nid: '20022691234567892',
        address: 'Gazipur',
        emergencyName: 'Kabir Hossain',
        emergencyPhone: '01819000097'
      }
    ],

    admissions: [
      {
        _id: 'adm-1',
        applicationNumber: 'APP-2026-0041',
        applicant: { firstName: 'Hasan', lastName: 'Mahmud', email: 'hasan@example.com', phone: '01700112233' },
        academic: { department: 'Computer Science & Technology', session: '2026-2028', rollNumber: 'CS-881' },
        roomPreference: 'double',
        status: 'pending',
        createdAt: '2026-11-18T10:00:00.000Z'
      },
      {
        _id: 'adm-2',
        applicationNumber: 'APP-2026-0040',
        applicant: { firstName: 'Nusrat', lastName: 'Jahan', email: 'nusrat@example.com', phone: '01700112244' },
        academic: { department: 'Electrical Engineering', session: '2026-2028', rollNumber: 'EE-104' },
        roomPreference: 'triple',
        status: 'approved',
        createdAt: '2026-11-17T12:30:00.000Z'
      },
      {
        _id: 'adm-3',
        applicationNumber: 'APP-2026-0039',
        applicant: { firstName: 'Sabbir', lastName: 'Hossain', email: 'sabbir@example.com', phone: '01700112255' },
        academic: { department: 'Business Administration', session: '2025-2027', rollNumber: 'BBA-302' },
        roomPreference: 'single',
        status: 'under_review',
        createdAt: '2026-11-16T09:15:00.000Z'
      }
    ],

    feeStructures: [
      { _id: 'fee-1', name: 'Monthly Hostel Rent (Shared Double)', type: 'monthly_rent', amount: 2500, description: 'Includes electricity, Wi-Fi and clean water' },
      { _id: 'fee-2', name: 'Hostel Security Deposit (One-time Refundable)', type: 'security_deposit', amount: 3000, description: 'Refundable after room clearance upon departure' },
      { _id: 'fee-3', name: 'Monthly Mess / Dining Hall Charge', type: 'mess_fee', amount: 3500, description: 'Standard 3-meal nutritious daily catering plan' },
      { _id: 'fee-4', name: 'Admission & Registration Fee', type: 'admission_fee', amount: 1500, description: 'Non-refundable institutional admission fee' }
    ],

    invoices: [
      {
        _id: 'inv-1',
        invoiceNumber: 'INV-2026-1101',
        student: { _id: 'std-1', user: { firstName: 'Tanvir', lastName: 'Ahmed' }, studentId: 'NIYD-2026-001' },
        title: 'November 2026 Hostel Rent & Utilities',
        amount: 2500,
        paidAmount: 2500,
        status: 'paid',
        dueDate: '2026-11-10T00:00:00.000Z',
        paidAt: '2026-11-05T14:20:00.000Z',
        paymentMethod: 'bKash',
        transactionId: 'BK9X271AA4'
      },
      {
        _id: 'inv-2',
        invoiceNumber: 'INV-2026-1102',
        student: { _id: 'std-2', user: { firstName: 'Farhana', lastName: 'Akter' }, studentId: 'NIYD-2026-002' },
        title: 'November 2026 Hostel Rent & Utilities',
        amount: 2500,
        paidAmount: 0,
        status: 'pending',
        dueDate: '2026-11-25T00:00:00.000Z'
      },
      {
        _id: 'inv-3',
        invoiceNumber: 'INV-2026-1103',
        student: { _id: 'std-3', user: { firstName: 'Md. Raihan', lastName: 'Kabir' }, studentId: 'NIYD-2026-003' },
        title: 'November 2026 Dining & Mess Fee',
        amount: 3500,
        paidAmount: 3500,
        status: 'paid',
        dueDate: '2026-11-15T00:00:00.000Z',
        paidAt: '2026-11-12T10:00:00.000Z',
        paymentMethod: 'Nagad',
        transactionId: 'NG771B89CD'
      }
    ],

    maintenance: [
      {
        _id: 'mnt-1',
        requestNumber: 'MNT-2026-012',
        student: { user: { firstName: 'Tanvir', lastName: 'Ahmed' } },
        room: { _id: 'r-101', roomNumber: '101' },
        building: { name: 'Block A' },
        category: 'electrical',
        title: 'Ceiling Fan Regulator Not Working',
        description: 'The ceiling fan speed regulator is sparking and stuck at full speed.',
        priority: 'high',
        status: 'in_progress',
        assignedTo: { user: { firstName: 'Md. Rafiqul', lastName: 'Islam' } },
        createdAt: '2026-11-18T08:30:00.000Z'
      },
      {
        _id: 'mnt-2',
        requestNumber: 'MNT-2026-011',
        student: { user: { firstName: 'Farhana', lastName: 'Akter' } },
        room: { _id: 'r-201', roomNumber: '201' },
        building: { name: 'Block B' },
        category: 'plumbing',
        title: 'Bathroom Tap Leaking Continuously',
        description: 'Water tap leaking heavily causing wet floor.',
        priority: 'medium',
        status: 'pending',
        createdAt: '2026-11-17T11:10:00.000Z'
      },
      {
        _id: 'mnt-3',
        requestNumber: 'MNT-2026-008',
        student: { user: { firstName: 'Md. Raihan', lastName: 'Kabir' } },
        room: { _id: 'r-102', roomNumber: '102' },
        building: { name: 'Block A' },
        category: 'carpentry',
        title: 'Study Table Drawer Lock Replacement',
        description: 'Drawer key broke inside the keyhole.',
        priority: 'low',
        status: 'completed',
        createdAt: '2026-11-14T09:00:00.000Z'
      }
    ],

    announcements: [
      {
        _id: 'ann-1',
        title: 'Hostel Gate Curfew & Evening Roll Call Notice',
        content: 'All resident students are strictly advised that main entry gates close at 09:30 PM sharp. Evening roll call will be conducted daily at 10:00 PM.',
        category: 'rules',
        priority: 'high',
        isPublished: true,
        createdAt: '2026-11-15T00:00:00.000Z'
      },
      {
        _id: 'ann-2',
        title: 'Monthly Room Inspection & Cleanliness Drive',
        content: 'Residential inspection team will visit Block A, B, and C rooms this Saturday between 10:00 AM and 01:00 PM.',
        category: 'general',
        priority: 'medium',
        isPublished: true,
        createdAt: '2026-11-12T00:00:00.000Z'
      },
      {
        _id: 'ann-3',
        title: 'Digital bKash/Nagad Fee Payment System Active',
        content: 'Residents can now pay monthly accommodation fees through bKash and Nagad with instant downloadable receipt generation.',
        category: 'fees',
        priority: 'low',
        isPublished: true,
        createdAt: '2026-11-01T00:00:00.000Z'
      }
    ],

    attendance: [
      {
        _id: 'att-1',
        student: { _id: 'std-1', user: { firstName: 'Tanvir', lastName: 'Ahmed' }, studentId: 'NIYD-2026-001', room: '101' },
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        markedAt: '2026-11-18T22:05:00.000Z'
      },
      {
        _id: 'att-2',
        student: { _id: 'std-2', user: { firstName: 'Farhana', lastName: 'Akter' }, studentId: 'NIYD-2026-002', room: '201' },
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        markedAt: '2026-11-18T22:10:00.000Z'
      },
      {
        _id: 'att-3',
        student: { _id: 'std-3', user: { firstName: 'Md. Raihan', lastName: 'Kabir' }, studentId: 'NIYD-2026-003', room: '102' },
        date: new Date().toISOString().split('T')[0],
        status: 'late_return',
        remarks: 'Reported with special permission from Department Head',
        markedAt: '2026-11-18T22:45:00.000Z'
      }
    ],

    settings: {
      gate_timings: { mainGateOpen: '06:00', mainGateClose: '21:30', rollCallTime: '22:00' },
      visitor_policy: { visitorAllowed: true, visitingHours: '04:00 PM - 07:00 PM', maxDurationHours: 2 }
    }
  };

  // Helper to load or initialize from localStorage
  function getTable(table) {
    const raw = localStorage.getItem(STORAGE_PREFIX + table);
    if (!raw) {
      const data = initialData[table] || [];
      localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(data));
      return JSON.parse(JSON.stringify(data));
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialData[table] || [];
    }
  }

  function setTable(table, data) {
    localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(data));
  }

  // Handle mock responses
  function handleRequest(endpoint, method = 'GET', body = null) {
    const cleanUrl = endpoint.replace(/^\/api/, '').split('?')[0];
    const params = new URLSearchParams(endpoint.includes('?') ? endpoint.split('?')[1] : '');

    // 1. Auth Me
    if (cleanUrl === '/auth/me') {
      const user = Auth.getUser() || initialData.users[0];
      return { success: true, user, student: initialData.students[0] };
    }

    // 2. Change password
    if (cleanUrl === '/auth/change-password') {
      return { success: true, message: 'Password updated successfully in demo mode' };
    }

    // 3. Admin Dashboard Overview
    if (cleanUrl === '/admin/dashboard') {
      const rooms = getTable('rooms');
      const students = getTable('students');
      const admissions = getTable('admissions');
      const maintenance = getTable('maintenance');
      const invoices = getTable('invoices');

      const totalBeds = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
      const occupiedBeds = rooms.reduce((acc, r) => acc + (r.currentOccupancy || 0), 0);
      const pendingAdmissions = admissions.filter(a => a.status === 'pending').length;
      const outstanding = invoices.filter(i => i.status === 'pending').reduce((acc, i) => acc + (i.amount || 0), 0);

      return {
        success: true,
        data: {
          stats: {
            totalBeds,
            occupiedBeds,
            availableBeds: Math.max(0, totalBeds - occupiedBeds),
            occupancyRate: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
            totalStudents: students.length,
            pendingApplications: pendingAdmissions,
            totalOutstandingFees: outstanding
          },
          recentAdmissions: admissions.slice(0, 5),
          recentMaintenance: maintenance.slice(0, 5)
        }
      };
    }

    // 4. Admin Dashboard Charts
    if (cleanUrl === '/admin/dashboard/charts') {
      return {
        success: true,
        data: {
          occupancyChart: {
            labels: ['Block A (Male)', 'Block B (Female)', 'Block C (Vocational)'],
            datasets: [
              { label: 'Occupied', data: [80, 65, 39], backgroundColor: '#146B45' },
              { label: 'Available', data: [20, 25, 21], backgroundColor: '#D5A63C' }
            ]
          },
          monthlyFinancials: {
            labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
            datasets: [
              { label: 'Collected (৳)', data: [120000, 135000, 140000, 125000, 150000, 162000], borderColor: '#146B45', backgroundColor: 'rgba(20, 107, 69, 0.1)', tension: 0.3, fill: true },
              { label: 'Due (৳)', data: [35000, 28000, 22000, 30000, 18000, 15000], borderColor: '#E53E3E', backgroundColor: 'rgba(229, 62, 62, 0.1)', tension: 0.3, fill: true }
            ]
          }
        }
      };
    }

    // 5. Admissions
    if (cleanUrl === '/admissions' || cleanUrl.startsWith('/admissions/')) {
      let list = getTable('admissions');
      if (cleanUrl.match(/\/admissions\/[a-zA-Z0-9_-]+$/)) {
        const id = cleanUrl.split('/').pop();
        const found = list.find(a => a._id === id || a.applicationNumber === id) || list[0];
        return { success: true, data: found, application: found };
      }
      if (method === 'PUT' && cleanUrl.includes('/status')) {
        const id = cleanUrl.split('/')[2];
        list = list.map(a => a._id === id ? { ...a, status: body?.status || a.status } : a);
        setTable('admissions', list);
        return { success: true, message: 'Application status updated' };
      }
      if (method === 'PUT' && cleanUrl.includes('/allocate')) {
        return { success: true, message: 'Room allocated successfully' };
      }
      if (method === 'PUT' && cleanUrl.includes('/confirm')) {
        return { success: true, message: 'Admission confirmed and student account created' };
      }
      return { success: true, data: { applications: list, pagination: { page: 1, total: list.length, pages: 1 } }, applications: list };
    }

    // 6. Students Directory
    if (cleanUrl === '/students' || cleanUrl.startsWith('/students/')) {
      const list = getTable('students');
      if (cleanUrl === '/students/me/dashboard') {
        const currentUser = Auth.getUser() || initialData.users[2];
        const student = list.find(s => s.user.email === currentUser.email) || list[0];
        const invoices = getTable('invoices');
        const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((a, b) => a + b.amount, 0);

        return {
          success: true,
          data: {
            student,
            allocation: {
              room: { roomNumber: student.roomNumber || '101', floor: 1, type: 'double' },
              bed: { bedNumber: student.bedNumber || 'A' },
              building: { name: student.buildingName || 'Block A' }
            },
            financialSummary: { totalDue: pendingAmount, totalPaid: 5000 },
            recentMaintenance: getTable('maintenance').slice(0, 3),
            announcements: getTable('announcements'),
            attendanceStats: { percentage: 94, totalDays: 30, presentDays: 28 }
          }
        };
      }
      if (cleanUrl === '/students/me/room') {
        return {
          success: true,
          data: {
            allocation: {
              room: { roomNumber: '101', floor: 1, type: 'double', capacity: 2, currentOccupancy: 2, rent: 2500, amenities: ['Wi-Fi', 'Study Table', 'Attached Bathroom'] },
              bed: { bedNumber: 'A' },
              building: { name: 'Block A (Shaheed Dr. Fazle Rabbi Hall)' }
            },
            roommates: [
              { user: { firstName: 'Sabbir', lastName: 'Hossain', phone: '01811223344' }, studentId: 'NIYD-2026-004', department: 'Computer Science', bed: { bedNumber: 'B' } }
            ]
          }
        };
      }
      if (cleanUrl === '/students/me/room-change') {
        return { success: true, message: 'Room change request submitted to Warden office.' };
      }
      return { success: true, data: { students: list, pagination: { page: 1, total: list.length, pages: 1 } }, students: list };
    }

    // 7. Rooms
    if (cleanUrl === '/rooms/buildings') {
      return { success: true, data: getTable('buildings'), buildings: getTable('buildings') };
    }
    if (cleanUrl === '/rooms' || cleanUrl.startsWith('/rooms/')) {
      let rooms = getTable('rooms');
      if (method === 'POST') {
        const newRoom = {
          _id: 'r-' + Date.now(),
          roomNumber: body?.roomNumber || '999',
          building: { _id: 'b-1', name: 'Block A' },
          floor: body?.floor || 1,
          capacity: body?.capacity || 2,
          currentOccupancy: 0,
          type: body?.type || 'double',
          rent: body?.rent || 2500,
          status: 'available',
          amenities: ['Wi-Fi', 'Ceiling Fan']
        };
        rooms.unshift(newRoom);
        setTable('rooms', rooms);
        return { success: true, data: newRoom, message: 'Room added successfully' };
      }
      if (method === 'PUT') {
        const id = cleanUrl.split('/')[2];
        rooms = rooms.map(r => r._id === id ? { ...r, status: body?.status || r.status } : r);
        setTable('rooms', rooms);
        return { success: true, message: 'Room status updated' };
      }
      if (method === 'DELETE') {
        const id = cleanUrl.split('/')[2];
        rooms = rooms.filter(r => r._id !== id);
        setTable('rooms', rooms);
        return { success: true, message: 'Room deleted' };
      }
      return { success: true, data: rooms, rooms };
    }

    // 8. Fees & Invoices
    if (cleanUrl === '/fees/structures') {
      if (method === 'POST') {
        const list = getTable('feeStructures');
        const newItem = { _id: 'fee-' + Date.now(), ...body };
        list.push(newItem);
        setTable('feeStructures', list);
        return { success: true, data: newItem, message: 'Fee structure created' };
      }
      return { success: true, data: getTable('feeStructures') };
    }
    if (cleanUrl === '/fees/invoices' || cleanUrl.startsWith('/fees/invoices/')) {
      let list = getTable('invoices');
      if (cleanUrl === '/fees/invoices/generate-monthly') {
        return { success: true, message: 'Monthly recurring invoices generated for all active residents' };
      }
      if (cleanUrl.match(/\/fees\/invoices\/[a-zA-Z0-9_-]+$/)) {
        const id = cleanUrl.split('/').pop();
        const found = list.find(i => i._id === id || i.invoiceNumber === id) || list[0];
        return { success: true, data: found, invoice: found };
      }
      return { success: true, data: { invoices: list, pagination: { page: 1, total: list.length } }, invoices: list };
    }
    if (cleanUrl === '/fees/payments/simulate') {
      const list = getTable('invoices');
      const invoiceId = body?.invoiceId;
      const updated = list.map(inv => {
        if (inv._id === invoiceId || inv.invoiceNumber === invoiceId) {
          return {
            ...inv,
            status: 'paid',
            paidAmount: inv.amount,
            paidAt: new Date().toISOString(),
            paymentMethod: body?.provider || 'bKash',
            transactionId: 'SIM_' + Math.random().toString(36).substring(2, 10).toUpperCase()
          };
        }
        return inv;
      });
      setTable('invoices', updated);
      return { success: true, message: 'Simulated payment completed successfully', transactionId: 'TXN_' + Date.now() };
    }
    if (cleanUrl === '/fees/payments/record') {
      return { success: true, message: 'Official offline receipt recorded successfully' };
    }

    // 9. Attendance
    if (cleanUrl === '/attendance' || cleanUrl.startsWith('/attendance/')) {
      const list = getTable('attendance');
      if (cleanUrl === '/attendance/mark' || cleanUrl === '/attendance/bulk-mark') {
        return { success: true, message: 'Attendance status recorded successfully' };
      }
      return { success: true, data: { records: list, stats: { total: list.length, present: list.filter(a => a.status === 'present').length } }, records: list };
    }

    // 10. Maintenance
    if (cleanUrl === '/maintenance' || cleanUrl.startsWith('/maintenance/')) {
      let list = getTable('maintenance');
      if (cleanUrl === '/maintenance/my-requests') {
        return { success: true, data: list, requests: list };
      }
      if (method === 'POST') {
        const newReq = {
          _id: 'mnt-' + Date.now(),
          requestNumber: 'MNT-2026-0' + (list.length + 10),
          category: body?.category || 'general',
          title: body?.title || 'Maintenance Request',
          description: body?.description || '',
          priority: body?.priority || 'medium',
          status: 'pending',
          room: { roomNumber: '101' },
          building: { name: 'Block A' },
          createdAt: new Date().toISOString()
        };
        list.unshift(newReq);
        setTable('maintenance', list);
        return { success: true, data: newReq, message: 'Maintenance complaint lodged successfully' };
      }
      if (method === 'PUT') {
        const id = cleanUrl.split('/')[2];
        list = list.map(m => m._id === id ? { ...m, status: body?.status || m.status } : m);
        setTable('maintenance', list);
        return { success: true, message: 'Maintenance ticket updated' };
      }
      return { success: true, data: { requests: list, pagination: { page: 1, total: list.length } }, requests: list };
    }

    // 11. Staff
    if (cleanUrl === '/staff') {
      const staffList = [
        { _id: 'st-1', user: { firstName: 'Md. Rafiqul', lastName: 'Islam' }, designation: 'Senior Electrician', department: 'Electrical' },
        { _id: 'st-2', user: { firstName: 'Abdul', lastName: 'Majid' }, designation: 'Plumbing Specialist', department: 'Plumbing' },
        { _id: 'st-3', user: { firstName: 'Shahidul', lastName: 'Alam' }, designation: 'Facility Supervisor', department: 'General Maintenance' }
      ];
      return { success: true, data: staffList, staff: staffList };
    }
    if (cleanUrl === '/staff/me/dashboard') {
      const list = getTable('maintenance');
      return {
        success: true,
        data: {
          staff: {
            user: { firstName: 'Md. Rafiqul', lastName: 'Islam' },
            staffId: 'STAFF-001',
            designation: 'Senior Electrician & Power Technician',
            department: 'Hostel Maintenance'
          },
          stats: { activeTasks: 3, urgentTasks: 1, completedToday: 2 },
          recentTasks: list
        }
      };
    }

    // 12. Announcements
    if (cleanUrl === '/announcements' || cleanUrl.startsWith('/announcements/')) {
      let list = getTable('announcements');
      if (method === 'POST') {
        const newAnn = { _id: 'ann-' + Date.now(), createdAt: new Date().toISOString(), ...body };
        list.unshift(newAnn);
        setTable('announcements', list);
        return { success: true, data: newAnn, message: 'Circular published successfully' };
      }
      if (method === 'DELETE') {
        const id = cleanUrl.split('/').pop();
        list = list.filter(a => a._id !== id);
        setTable('announcements', list);
        return { success: true, message: 'Circular deleted' };
      }
      return { success: true, data: list, announcements: list };
    }

    // 13. Reports
    if (cleanUrl === '/reports/occupancy') {
      return {
        success: true,
        data: {
          totalCapacity: 250,
          totalOccupied: 184,
          occupancyPercentage: 73.6,
          buildingStats: [
            { name: 'Block A (Male)', capacity: 100, occupied: 80, percentage: 80 },
            { name: 'Block B (Female)', capacity: 90, occupied: 65, percentage: 72 },
            { name: 'Block C (Vocational)', capacity: 60, occupied: 39, percentage: 65 }
          ]
        }
      };
    }
    if (cleanUrl === '/reports/financial') {
      return {
        success: true,
        data: {
          totalBilled: 750000,
          totalCollected: 685000,
          totalOutstanding: 65000,
          collectionRate: 91.3,
          breakdown: [
            { category: 'Hostel Accommodation', billed: 450000, collected: 420000 },
            { category: 'Dining / Mess Charges', billed: 250000, collected: 225000 },
            { category: 'Security Deposit & Admissions', billed: 50000, collected: 40000 }
          ]
        }
      };
    }

    // 14. Settings
    if (cleanUrl === '/settings' || cleanUrl.startsWith('/settings/')) {
      return {
        success: true,
        data: {
          gate_timings: { mainGateOpen: '06:00', mainGateClose: '21:30', rollCallTime: '22:00' },
          visitor_policy: { visitorAllowed: true, visitingHours: '04:00 PM - 07:00 PM', maxDurationHours: 2 }
        },
        message: 'Settings updated'
      };
    }

    // Default fallback
    return { success: true, data: [], message: 'OK' };
  }

  return {
    handleRequest,
    getTable,
    setTable
  };
})();

window.MockDB = MockDB;
