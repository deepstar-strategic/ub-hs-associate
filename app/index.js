const hubspot = require('@hubspot/api-client');
const { crm } = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

const fetch = async (method, properties) => {
  const records = await crm[method].getAll(
    10,
    undefined,
    properties,
    undefined,
    undefined,
    false
  );

  /**
   * Filter out records without an actual "Account ID".
   */
  return records.filter((i) => i.properties.ub_app_feedbackcore_aid);
}

const run = async () => {
  const contacts = await fetch('contacts', ['email', 'firstname', 'lastname', 'ub_app_feedbackcore_aid']);
  const companies = await fetch('companies', ['name', 'ub_app_feedbackcore_billing_email', 'ub_app_feedbackcore_aid']);

  const associations = [];
  contacts.forEach((contact) => {
    const company = companies.find(({ properties }) => properties.ub_app_feedbackcore_aid === contact.properties.ub_app_feedbackcore_aid);
    if (company) {
      associations.push(crm.companies.associationsApi.create(
        company.id,
        'contacts',
        contact.id,
        'company_to_contact'
      ));
    }
  });

  return Promise.all(associations);
};

const { log, error } = console;
run().then((results) => log(`> Created ${results.length} associations.`)).catch((e) => error(e.message));
