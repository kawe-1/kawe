import { Notes, Concepts, Quiz, Flashcards } from "../endpoints/artifacts";

export const MOCK_NOTES: Notes = {
  sections: [
    { heading: 'Overview: How Memory Works', body: 'Memory is not a single system but a collection of processes that encode, store, and retrieve information. Research from your lecture slides and the YouTube video converge on a three stage model: sensory memory captures raw input for milliseconds, short term memory holds a small amount of information for seconds, and long term memory can persist for a lifetime.', cite: 'Lecture Slides + YouTube' },
    { heading: 'Sensory Memory', body: 'Sensory memory is the earliest stage. Iconic memory (visual) lasts roughly 250 milliseconds while echoic memory (auditory) persists for about 3 to 4 seconds. Your professor emphasized that sensory memory acts as a "buffer" that filters what reaches conscious awareness.', cite: 'Tutorial Week 6' },
    { heading: 'Short Term Memory and Working Memory', body: 'George Miller\'s classic research suggests short term memory holds about seven items (plus or minus two). Chunking, the strategy of grouping information into meaningful units, can effectively increase this capacity. Working memory, as described by Baddeley, adds an active processing component with a central executive, phonological loop, and visuospatial sketchpad.', cite: 'Lecture Slides + Class Notes' },
    { heading: 'Long Term Memory', body: 'Long term memory divides into explicit (declarative) and implicit (nondeclarative) types. Explicit memory further splits into episodic (personal events) and semantic (general facts). Implicit memory includes procedural memory (skills like riding a bike) and priming effects. The YouTube video provides a helpful visual of this taxonomy.', cite: 'YouTube + Lecture Slides' },
    { heading: 'The Hippocampus and Consolidation', body: 'The hippocampus is critical for converting short term memories into long term ones, a process called consolidation. Patient H.M., who had both hippocampi removed, could not form new explicit memories but retained procedural learning. Sleep plays a vital role in consolidation by replaying neural patterns from the day.', cite: 'All 4 Sources' },
    { heading: 'Encoding Strategies', body: 'Levels of processing theory (Craik and Lockhart) shows that deeper, more meaningful processing leads to stronger memories. Elaborative rehearsal, connecting new information to existing knowledge, outperforms simple rote repetition. Spaced practice is more effective than massed practice (cramming) for long term retention.', cite: 'Tutorial + Class Notes' },
  ]
};

export const MOCK_CONCEPTS: Concepts = {
  concepts: [
    { term: 'Chunking', explanation: 'Grouping individual pieces of information into larger, meaningful units. For example, remembering a phone number as three groups rather than ten separate digits.' },
    { term: 'Consolidation', explanation: 'The process by which short term memories become stable long term memories. This happens primarily during sleep, when the hippocampus replays experiences.' },
    { term: 'Episodic vs Semantic Memory', explanation: 'Episodic memory stores personal experiences with time and place context ("my 10th birthday"). Semantic memory stores general knowledge without personal context ("Paris is the capital of France").' },
  ]
};

export const MOCK_QUIZ: Quiz = {
  quizzes: [
    { question: 'What is the approximate capacity of short term memory according to Miller?', choices: ['3 items', '5 items', '7 items (plus or minus 2)', '12 items'], correct_answer: '7 items (plus or minus 2)', explanation: 'George Miller\'s 1956 paper established the "magic number" of 7 plus or minus 2 as the capacity of short term memory.' },
    { question: 'Which brain structure is most critical for forming new explicit memories?', choices: ['Amygdala', 'Hippocampus', 'Cerebellum', 'Prefrontal cortex'], correct_answer: 'Hippocampus', explanation: 'The hippocampus is essential for consolidating new explicit (declarative) memories, as demonstrated by studies of Patient H.M.' },
    { question: 'Which type of rehearsal leads to stronger long term memories?', choices: ['Maintenance rehearsal', 'Elaborative rehearsal', 'Passive review', 'Speed reading'], correct_answer: 'Elaborative rehearsal', explanation: 'Elaborative rehearsal involves connecting new information to existing knowledge, which creates deeper encoding and stronger memory traces.' },
    { question: 'How long does iconic (visual) sensory memory typically last?', choices: ['About 250 milliseconds', 'About 3 seconds', 'About 30 seconds', 'About 5 minutes'], correct_answer: 'About 250 milliseconds', explanation: 'Iconic memory, the visual form of sensory memory, persists for roughly 250 milliseconds before fading.' },
    { question: 'What did Patient H.M. demonstrate about memory systems?', choices: ['All memory is stored in the hippocampus', 'Explicit and implicit memory are separate systems', 'Memory cannot be improved', 'Short term memory is unlimited'], correct_answer: 'Explicit and implicit memory are separate systems', explanation: 'H.M. could still form new procedural (implicit) memories despite losing the ability to form new explicit memories, proving these are distinct systems.' },
  ]
};

export const MOCK_FLASHCARDS: Flashcards = {
  flashcards: [
    { front: 'What is chunking?', back: 'Grouping individual pieces of information into larger meaningful units to increase the effective capacity of short term memory.' },
    { front: 'Name the three components of Baddeley\'s working memory model.', back: 'Central executive, phonological loop, and visuospatial sketchpad.' },
    { front: 'What is the difference between episodic and semantic memory?', back: 'Episodic memory stores personal experiences with context. Semantic memory stores general facts without personal context.' },
    { front: 'What role does the hippocampus play in memory?', back: 'It is critical for consolidating short term memories into long term memories. Damage to it prevents new explicit memory formation.' },
    { front: 'What is the levels of processing theory?', back: 'Craik and Lockhart\'s theory that deeper, more meaningful processing of information leads to more durable memory traces than shallow processing.' },
    { front: 'Why is spaced practice better than cramming?', back: 'Spacing study sessions allows for repeated consolidation cycles, strengthening memory traces. Massed practice produces rapid forgetting.' },
    { front: 'How long does echoic memory last?', back: 'Approximately 3 to 4 seconds. It is the auditory form of sensory memory.' },
    { front: 'What did Patient H.M. teach us?', back: 'That explicit and implicit memory are separate systems. H.M. could learn new motor skills but could not form new conscious memories after bilateral hippocampal removal.' },
  ]
};
