/**
 * NIYD Hostel Management System - Constants & Enums
 */

const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  STAFF: 'staff'
};

const APPLICATION_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WAITLISTED: 'waitlisted',
  INFO_REQUIRED: 'info_required'
};

const ROOM_STATUS = {
  AVAILABLE: 'available',
  FULL: 'full',
  MAINTENANCE: 'maintenance',
  UNAVAILABLE: 'unavailable'
};

const BED_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance'
};

const ROOM_TYPE = {
  SINGLE: 'single',
  DOUBLE: 'double',
  TRIPLE: 'triple',
  QUAD: 'quad',
  DORMITORY: 'dormitory'
};

const INVOICE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

const PAYMENT_METHOD = {
  BKASH: 'bkash',
  NAGAD: 'nagad',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  REFUNDED: 'refunded'
};

const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  CHECKED_OUT: 'checked_out',
  LATE_RETURN: 'late_return'
};

const MAINTENANCE_CATEGORY = {
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  CLEANING: 'cleaning',
  FURNITURE: 'furniture',
  INTERNET_WIFI: 'internet_wifi',
  OTHER: 'other'
};

const MAINTENANCE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const MAINTENANCE_STATUS = {
  SUBMITTED: 'submitted',
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

module.exports = {
  ROLES,
  APPLICATION_STATUS,
  ROOM_STATUS,
  BED_STATUS,
  ROOM_TYPE,
  INVOICE_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ATTENDANCE_STATUS,
  MAINTENANCE_CATEGORY,
  MAINTENANCE_PRIORITY,
  MAINTENANCE_STATUS
};
