const { pick, omitUndefined, pipe } = require('../objectUtil');

const CUSTOMER_COMMON_FIELDS = [
  'name',
  'email',
  'passwordHash',
  'birthDate',
  'phone',
  'street',
  'number',
  'district',
  'city',
  'state',
  'zipCode',
];

/**
 * Mapeia DTO -> campos comuns de Customer (full).
 * Não remove undefined (útil no create).
 */
function mapCustomerCommon(dto = {}) {
  return pick(dto, CUSTOMER_COMMON_FIELDS);
}

/**
 * Versão partial (para updates): mapeia e remove undefined.
 */
const mapCustomerCommonPartial = pipe(mapCustomerCommon, omitUndefined);

/**
 * Mapeia DTO -> campos específicos de Person.
 */
function mapPerson(dto = {}) {
  return {
    customerId: dto.customerId, 
    cpf: dto.cpf,
    monthlyIncome: dto.monthlyIncome,
  };
}

const mapPersonPartial = pipe(mapPerson, omitUndefined);

/**
 * Mapeia DTO -> campos específicos de Business.
 */
function mapBusiness(dto = {}) {
  return {
    customerId: dto.customerId, 
    cnpj: dto.cnpj,
    isIcmsExempt: dto.isIcmsExempt,
    stateRegistration: dto.stateRegistration ?? null, 
  };
}

const mapBusinessPartial = pipe(mapBusiness, omitUndefined);

module.exports = {
  CUSTOMER_COMMON_FIELDS,
  mapCustomerCommon,
  mapCustomerCommonPartial,
  mapPerson,
  mapPersonPartial,
  mapBusiness,
  mapBusinessPartial,
};
