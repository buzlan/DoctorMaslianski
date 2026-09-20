export type ClinicContact = {
  phone?: string;
  email?: string;
  bookingUrl?: string;
};

export type ClinicContactChannelKind = 'phone' | 'email' | 'booking';

export type ClinicContactChannel = {
  kind: ClinicContactChannelKind;
  href: string;
};
