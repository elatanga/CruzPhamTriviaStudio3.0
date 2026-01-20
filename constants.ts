
import { Category } from './types';

export const SOUND_ASSETS = {
  select: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  reveal: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  timer: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  correct: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
};

export const INITIAL_BOARD_DATA: Category[] = [
  {
    id: 'cat-1',
    title: 'TECH HISTORY',
    questions: [
      { id: 'q1-200', categoryId: 'cat-1', points: 200, prompt: 'This "Apple" co-founder built the first Apple I computer.', answer: 'Steve Wozniak', status: 'available' },
      { id: 'q1-400', categoryId: 'cat-1', points: 400, prompt: 'The year the World Wide Web was first introduced to the public.', answer: '1991', status: 'available' },
      { id: 'q1-600', categoryId: 'cat-1', points: 600, prompt: 'This programming language, named after a gemstone, was created in 1995.', answer: 'Ruby', status: 'available' },
      { id: 'q1-800', categoryId: 'cat-1', points: 800, prompt: 'The first version of this popular OS was released in November 1985.', answer: 'Windows', status: 'available' },
      { id: 'q1-1000', categoryId: 'cat-1', points: 1000, prompt: 'The name of the very first search engine, created in 1990.', answer: 'Archie', status: 'available' },
    ]
  },
  {
    id: 'cat-2',
    title: 'LUXURY CARS',
    questions: [
      { id: 'q2-200', categoryId: 'cat-2', points: 200, prompt: 'The iconic "Prancing Horse" belongs to this Italian brand.', answer: 'Ferrari', status: 'available' },
      { id: 'q2-400', categoryId: 'cat-2', points: 400, prompt: 'This British brand is famous for the "Spirit of Ecstasy" ornament.', answer: 'Rolls-Royce', status: 'available' },
      { id: 'q2-600', categoryId: 'cat-2', points: 600, prompt: 'The luxury division of Toyota.', answer: 'Lexus', status: 'available' },
      { id: 'q2-800', categoryId: 'cat-2', points: 800, prompt: 'This brand\'s logo features four interlocking rings.', answer: 'Audi', status: 'available' },
      { id: 'q2-1000', categoryId: 'cat-2', points: 1000, prompt: 'The flagship luxury sedan produced by Mercedes-Benz.', answer: 'S-Class', status: 'available' },
    ]
  },
  {
    id: 'cat-3',
    title: 'GEN Z SLANG',
    questions: [
      { id: 'q3-200', categoryId: 'cat-3', points: 200, prompt: 'This term is used to describe someone who is being fake or lying.', answer: 'Cap', status: 'available' },
      { id: 'q3-400', categoryId: 'cat-3', points: 400, prompt: 'To be "this" is to be exceptionally stylish or impressive.', answer: 'Snatched', status: 'available' },
      { id: 'q3-600', categoryId: 'cat-3', points: 600, prompt: 'Short for charisma, usually used to describe someone with game.', answer: 'Rizz', status: 'available' },
      { id: 'q3-800', categoryId: 'cat-3', points: 800, prompt: 'Used to describe a situation that is embarrassing or uncomfortable.', answer: 'Cringe', status: 'available' },
      { id: 'q3-1000', categoryId: 'cat-3', points: 1000, prompt: 'This word means to leave someone or ignore them completely.', answer: 'Ghost', status: 'available' },
    ]
  },
  {
    id: 'cat-4',
    title: 'GLOBAL FOOD',
    questions: [
      { id: 'q4-200', categoryId: 'cat-4', points: 200, prompt: 'This flatbread is a staple in Indian cuisine.', answer: 'Naan', status: 'available' },
      { id: 'q4-400', categoryId: 'cat-4', points: 400, prompt: 'A traditional Japanese soup made from fermented soybeans.', answer: 'Miso Soup', status: 'available' },
      { id: 'q4-600', categoryId: 'cat-4', points: 600, prompt: 'The primary ingredient in Hummus.', answer: 'Chickpeas', status: 'available' },
      { id: 'q4-800', categoryId: 'cat-4', points: 800, prompt: 'A French pastry made of thin layers of dough and butter.', answer: 'Croissant', status: 'available' },
      { id: 'q4-1000', categoryId: 'cat-4', points: 1000, prompt: 'This spicy Korean side dish is made of fermented vegetables.', answer: 'Kimchi', status: 'available' },
    ]
  },
  {
    id: 'cat-5',
    title: 'GEOGRAPHY',
    questions: [
      { id: 'q5-200', categoryId: 'cat-5', points: 200, prompt: 'The smallest country in the world.', answer: 'Vatican City', status: 'available' },
      { id: 'q5-400', categoryId: 'cat-5', points: 400, prompt: 'This river runs through Egypt and is often called the longest.', answer: 'Nile', status: 'available' },
      { id: 'q5-600', categoryId: 'cat-5', points: 600, prompt: 'The capital city of Australia.', answer: 'Canberra', status: 'available' },
      { id: 'q5-800', categoryId: 'cat-5', points: 800, prompt: 'This desert is the largest hot desert in the world.', answer: 'Sahara', status: 'available' },
      { id: 'q5-1000', categoryId: 'cat-5', points: 1000, prompt: 'The mountain range that forms the natural border between Europe and Asia.', answer: 'Urals', status: 'available' },
    ]
  }
];
