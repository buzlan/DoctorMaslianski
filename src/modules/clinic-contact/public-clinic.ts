/** Contacts page on the doctor's public site. */
export const CLINIC_WEBSITE_URL = 'https://maslianski.by/#contacts';

export const PUBLIC_CLINIC_PHONES = [
  {
    id: 'short',
    labelKey: 'shortPhoneLabel',
    display: '7095',
    dial: '7095',
  },
  {
    id: 'a1',
    labelKey: 'a1PhoneLabel',
    display: '+375 (44) 538-70-95',
    dial: '+375445387095',
  },
  {
    id: 'mts',
    labelKey: 'mtsPhoneLabel',
    display: '+375 (29) 508-70-95',
    dial: '+375295087095',
  },
  {
    id: 'landline',
    labelKey: 'landlinePhoneLabel',
    display: '+375 (17) 370-00-05',
    dial: '+375173700005',
  },
] as const;
