import { CLINIC_WEBSITE_URL, PUBLIC_CLINIC_PHONES } from './public-clinic';

describe('public clinic contact', () => {
  it('points patients to the doctor website contacts section', () => {
    expect(CLINIC_WEBSITE_URL).toBe('https://maslianski.by/#contacts');
  });

  it('keeps dialable clinic phone numbers', () => {
    expect(PUBLIC_CLINIC_PHONES.map((phone) => phone.dial)).toEqual([
      '7095',
      '+375445387095',
      '+375295087095',
      '+375173700005',
    ]);
  });
});
