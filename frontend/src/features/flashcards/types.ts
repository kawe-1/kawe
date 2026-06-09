export interface FlashcardData {
  front: string;
  back: string;
}

export interface FlashcardDeck {
  cards: FlashcardData[];
}
