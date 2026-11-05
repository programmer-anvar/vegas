import userRepository from '#repositories/user.repository.js';
import ApiError from '#utils/ApiError.js';

const sellerService = {
  async create({ fullName, email, phone, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('Bu email bilan foydalanuvchi allaqachon mavjud');
    }

    const user = await userRepository.create({ fullName, email, phone, password, role: 'seller' });
    return userRepository.findById(user._id);
  },

  async list() {
    return userRepository.findAll({ role: 'seller' }, { page: 1, limit: 100 });
  },

  async update(id, data) {
    const seller = await userRepository.findById(id);
    if (!seller || seller.role !== 'seller') {
      throw ApiError.notFound('Sotuvchi topilmadi');
    }
    return userRepository.updateById(id, data);
  },
};

export default sellerService;
