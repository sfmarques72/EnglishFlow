import { Session } from "../types";

export const STUDY_SCHEDULE: Session[] = [
  // ==================== LEVEL A1 ====================
  {
    id: "A1-w1-d1",
    week: 1,
    day: 1,
    level: "A1",
    title: "Apresentando-se com Confiança",
    topic: "Personal Introductions",
    grammarTitle: "Present Simple (To Be + Verbos Básicos)",
    grammarStructure: "I am... / I live in... / I like...",
    grammarExplanation: "Use 'I am' para se apresentar, 'I live in' para dizer sua cidade, e 'I like' para falar do que gosta.",
    grammarExample: "I am John. I live in Lisbon. I like coffee.",
    warmupPrompts: [
      "Fale em voz alta: 'Hello, my name is John.'",
      "Pratique a pronúncia: 'Nice to meet you!'",
      "Complete em voz alta: 'I live in...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga sua profissão.",
        translation: "Eu sou um(a) estudante.",
        template: "I am a..."
      },
      {
        id: "card-2",
        prompt: "Diga onde mora.",
        translation: "Eu moro em São Paulo.",
        template: "I live in..."
      },
      {
        id: "card-3",
        prompt: "Diga algo que você gosta.",
        translation: "Eu gosto de música.",
        template: "I like..."
      }
    ]
  },
  {
    id: "A1-w1-d2",
    week: 1,
    day: 2,
    level: "A1",
    title: "Descrevendo Outras Pessoas",
    topic: "Describing People",
    grammarTitle: "Present Simple (Third Person Singular)",
    grammarStructure: "He is... / She works... / He likes...",
    grammarExplanation: "Na terceira pessoa do singular (He, She), adicionamos 's' ou 'es' ao final do verbo.",
    grammarExample: "She wakes up early. He likes tea.",
    warmupPrompts: [
      "Fale em voz alta: 'He is my friend.'",
      "Pratique a pronúncia: 'She speaks English.'",
      "Complete em voz alta: 'My friend likes...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga a profissão do seu amigo.",
        translation: "Ele é um engenheiro.",
        template: "He is a..."
      },
      {
        id: "card-2",
        prompt: "Descreva onde sua mãe trabalha.",
        translation: "Ela trabalha em um escritório.",
        template: "She works at..."
      },
      {
        id: "card-3",
        prompt: "Mencione o hobby do seu irmão.",
        translation: "Ele gosta de jogar futebol.",
        template: "He likes to..."
      }
    ]
  },
  {
    id: "A1-w1-d3",
    week: 1,
    day: 3,
    level: "A1",
    title: "Minha Rotina Semanal",
    topic: "Weekly Routine",
    grammarTitle: "Adverbs of Frequency",
    grammarStructure: "I always... / I usually... / I never...",
    grammarExplanation: "Use advérbios de frequência antes do verbo principal para indicar a frequência de um hábito.",
    grammarExample: "I always study English. I never sleep late.",
    warmupPrompts: [
      "Fale em voz alta: 'I always drink water.'",
      "Pratique a pronúncia: 'I usually eat bread.'",
      "Complete em voz alta: 'I never...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga algo que você sempre faz de manhã.",
        translation: "Eu sempre tomo café às 7h.",
        template: "I always..."
      },
      {
        id: "card-2",
        prompt: "Diga algo que você geralmente faz no sábado.",
        translation: "Eu geralmente corro no parque.",
        template: "I usually..."
      },
      {
        id: "card-3",
        prompt: "Diga algo perigoso ou ruim que você nunca faz.",
        translation: "Eu nunca durmo tarde.",
        template: "I never..."
      }
    ]
  },
  {
    id: "A1-w2-d1",
    week: 2,
    day: 1,
    level: "A1",
    title: "O que temos em casa?",
    topic: "Home Items",
    grammarTitle: "Existential (There is / There are)",
    grammarStructure: "There is a... / There are some...",
    grammarExplanation: "Use 'There is' para singular (há/tem) e 'There are' para plural.",
    grammarExample: "There is a sofa. There are two chairs.",
    warmupPrompts: [
      "Fale em voz alta: 'There is a bed in my room.'",
      "Pratique a pronúncia: 'There are windows here.'",
      "Complete em voz alta: 'In my house, there is...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga o que tem na sua sala.",
        translation: "Tem uma televisão na minha sala.",
        template: "There is a... in my living room."
      },
      {
        id: "card-2",
        prompt: "Diga os móveis que tem no seu quarto.",
        translation: "Há alguns livros na minha estante.",
        template: "There are some... in my room."
      },
      {
        id: "card-3",
        prompt: "Diga o que não tem na sua cozinha.",
        translation: "Não há um microondas.",
        template: "There is no... in my kitchen."
      }
    ]
  },
  {
    id: "A1-w2-d2",
    week: 2,
    day: 2,
    level: "A1",
    title: "Minhas Comidas Favoritas",
    topic: "Food & Drinks",
    grammarTitle: "Countable & Uncountable (Some/Any)",
    grammarStructure: "I have some... / I don't have any...",
    grammarExplanation: "Use 'some' para frases afirmativas (algum/um pouco) e 'any' para negativas e perguntas.",
    grammarExample: "I want some water. I don't have any apples.",
    warmupPrompts: [
      "Fale em voz alta: 'I eat bread every morning.'",
      "Pratique: 'Do you want some juice?'",
      "Complete: 'I love to drink...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Peça um copo de bebida de forma educada.",
        translation: "Gostaria de um pouco de água, por favor.",
        template: "I would like some..."
      },
      {
        id: "card-2",
        prompt: "Diga que você não tem nenhuma fruta na geladeira.",
        translation: "Eu não tenho nenhuma fruta.",
        template: "I don't have any..."
      },
      {
        id: "card-3",
        prompt: "Diga qual é o seu prato favorito.",
        translation: "Minha comida favorita é pizza.",
        template: "My favorite food is..."
      }
    ]
  },
  {
    id: "A1-w2-d3",
    week: 2,
    day: 3,
    level: "A1",
    title: "Fazendo Compras Simples",
    topic: "Shopping Basics",
    grammarTitle: "How Much / How Many",
    grammarStructure: "How much is this... ? / How many... do you have?",
    grammarExplanation: "Use 'How much' para perguntar o preço ou para incontáveis, e 'How many' para contáveis no plural.",
    grammarExample: "How much is the milk? How many apples do you want?",
    warmupPrompts: [
      "Fale em voz alta: 'How much is this shirt?'",
      "Pratique a pronúncia: 'I want three oranges.'",
      "Complete: 'How many...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Pergunte o preço de um casaco.",
        translation: "Quanto custa este casaco?",
        template: "How much is this..."
      },
      {
        id: "card-2",
        prompt: "Pergunte a quantidade de canetas que o vendedor tem.",
        translation: "Quantas canetas você tem?",
        template: "How many... do you have?"
      },
      {
        id: "card-3",
        prompt: "Diga que vai comprar o item.",
        translation: "Eu vou comprar este livro.",
        template: "I will buy this..."
      }
    ]
  },
  {
    id: "A1-w3-d1",
    week: 3,
    day: 1,
    level: "A1",
    title: "Minha Família e Parentes",
    topic: "Family Members",
    grammarTitle: "Possessive Adjectives",
    grammarStructure: "My... / Your... / His... / Her...",
    grammarExplanation: "Use possessivos para indicar posse ou relação familiar.",
    grammarExample: "My brother is tall. Her sister is young.",
    warmupPrompts: [
      "Fale em voz alta: 'This is my father.'",
      "Pratique: 'What is your sister's name?'",
      "Complete: 'My mother is...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Fale sobre a idade de um irmão.",
        translation: "Meu irmão tem 20 anos.",
        template: "My brother is... years old."
      },
      {
        id: "card-2",
        prompt: "Apresente o nome da sua esposa ou marido.",
        translation: "O nome dela/dele é...",
        template: "Her/His name is..."
      },
      {
        id: "card-3",
        prompt: "Descreva a profissão do seu pai.",
        translation: "Meu pai é médico.",
        template: "My father is a..."
      }
    ]
  },
  {
    id: "A1-w3-d2",
    week: 3,
    day: 2,
    level: "A1",
    title: "Lugares na Cidade",
    topic: "City Locations",
    grammarTitle: "Prepositions of Place",
    grammarStructure: "In / On / At / Next to / Across from",
    grammarExplanation: "Preposições de lugar posicionam itens no espaço.",
    grammarExample: "The bank is next to the bakery. I am at the park.",
    warmupPrompts: [
      "Fale: 'The supermarket is near my house.'",
      "Pratique: 'Where is the school?'",
      "Complete: 'I am at the...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga onde fica a farmácia em relação a um banco.",
        translation: "A farmácia fica ao lado do banco.",
        template: "The pharmacy is next to the..."
      },
      {
        id: "card-2",
        prompt: "Diga que você está na rodoviária.",
        translation: "Eu estou na rodoviária agora.",
        template: "I am at the bus station..."
      },
      {
        id: "card-3",
        prompt: "Explique que sua casa fica em uma rua específica.",
        translation: "Minha casa fica na rua principal.",
        template: "My house is on..."
      }
    ]
  },
  {
    id: "A1-w3-d3",
    week: 3,
    day: 3,
    level: "A1",
    title: "Clima e Estações",
    topic: "Weather & Seasons",
    grammarTitle: "It's + Weather Adjective",
    grammarStructure: "It's sunny / It's raining / It's cold",
    grammarExplanation: "Use 'It's' seguido do estado climático para descrever o tempo.",
    grammarExample: "It's hot today. It's snowing in Canada.",
    warmupPrompts: [
      "Fale: 'I like when it is sunny.'",
      "Pratique: 'Is it cold outside?'",
      "Complete: 'Today, the weather is...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Descreva o clima de hoje na sua cidade.",
        translation: "Está chovendo e frio hoje.",
        template: "It is... and... today."
      },
      {
        id: "card-2",
        prompt: "Diga qual é a sua estação do ano favorita.",
        translation: "Minha estação favorita é o verão.",
        template: "My favorite season is..."
      },
      {
        id: "card-3",
        prompt: "Diga o que você faz quando está ensolarado.",
        translation: "Quando está ensolarado, eu vou à praia.",
        template: "When it is sunny, I..."
      }
    ]
  },
  {
    id: "A1-w4-d1",
    week: 4,
    day: 1,
    level: "A1",
    title: "Atividades de Lazer",
    topic: "Hobbies & Leisure",
    grammarTitle: "Present Continuous Basics",
    grammarStructure: "I am playing... / She is reading...",
    grammarExplanation: "Use o Present Continuous para descrever o que está acontecendo exatamente no momento da fala.",
    grammarExample: "I am studying now. They are watching a movie.",
    warmupPrompts: [
      "Fale: 'I am speaking English.'",
      "Pratique: 'Are you listening to music?'",
      "Complete: 'Right now, I am...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga o que você está fazendo neste exato momento.",
        translation: "Eu estou estudando inglês agora.",
        template: "Right now, I am studying..."
      },
      {
        id: "card-2",
        prompt: "Diga o que um familiar está fazendo na outra sala.",
        translation: "Ela está cozinhando o jantar.",
        template: "She is cooking..."
      },
      {
        id: "card-3",
        prompt: "Mencione o que seus amigos estão fazendo hoje à tarde.",
        translation: "Eles estão jogando videogame.",
        template: "My friends are playing..."
      }
    ]
  },
  {
    id: "A1-w4-d2",
    week: 4,
    day: 2,
    level: "A1",
    title: "Minhas Habilidades",
    topic: "Abilities",
    grammarTitle: "Modal Verb: Can / Can't",
    grammarStructure: "I can speak... / I can't swim",
    grammarExplanation: "Use 'can' para habilidades e capacidades, e 'can't' para o que não sabe/consegue fazer.",
    grammarExample: "I can drive a car. He can't ride a bike.",
    warmupPrompts: [
      "Fale: 'I can speak Portuguese very well.'",
      "Pratique: 'Can you speak English?'",
      "Complete: 'I can play... but I can't play...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga uma habilidade manual que você domina.",
        translation: "Eu sei cozinhar comida italiana.",
        template: "I can cook..."
      },
      {
        id: "card-2",
        prompt: "Mencione algo que você não sabe fazer de jeito nenhum.",
        translation: "Eu não sei tocar piano.",
        template: "I can't play..."
      },
      {
        id: "card-3",
        prompt: "Pergunte se o seu interlocutor sabe dirigir.",
        translation: "Você sabe dirigir um carro?",
        template: "Can you drive..."
      }
    ]
  },
  {
    id: "A1-w4-d3",
    week: 4,
    day: 3,
    level: "A1",
    title: "Comparando Coisas Básicas",
    topic: "Comparisons",
    grammarTitle: "Comparative Adjectives (Short)",
    grammarStructure: "... is taller than... / ... is faster than...",
    grammarExplanation: "Adicione '-er' + 'than' a adjetivos curtos para fazer comparações.",
    grammarExample: "My brother is taller than me. A car is faster than a bicycle.",
    warmupPrompts: [
      "Fale: 'English is easier than Chinese.'",
      "Pratique: 'This car is older than mine.'",
      "Complete: 'My city is colder than...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Compare o tamanho de duas capitais.",
        translation: "Tóquio é maior que Nova York.",
        template: "Tokyo is bigger than..."
      },
      {
        id: "card-2",
        prompt: "Compare sua altura com a de um amigo.",
        translation: "Eu sou mais alto que meu amigo.",
        template: "I am taller than..."
      },
      {
        id: "card-3",
        prompt: "Compare duas matérias escolares.",
        translation: "História é mais fácil que matemática.",
        template: "History is easier than..."
      }
    ]
  },

  // ==================== LEVEL A2 ====================
  {
    id: "A2-w1-d1",
    week: 1,
    day: 1,
    level: "A2",
    title: "Minha Infância e Passado",
    topic: "Past Life",
    grammarTitle: "Past Simple: To Be (Was / Were)",
    grammarStructure: "I was... / We were... / I wasn't...",
    grammarExplanation: "No passado, o verbo 'to be' assume a forma 'was' (para I, He, She, It) ou 'were' (para You, We, They).",
    grammarExample: "I was a quiet child. They were happy yesterday.",
    warmupPrompts: [
      "Fale: 'I was born in Brazil.'",
      "Pratique: 'Where were you yesterday?'",
      "Complete: 'When I was young, I was...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga como você era quando criança (quiet, hyperactive, curious).",
        translation: "Eu era uma criança muito curiosa.",
        template: "When I was a child, I was very..."
      },
      {
        id: "card-2",
        prompt: "Diga onde você estava ontem às 20h.",
        translation: "Eu estava em casa ontem à noite.",
        template: "Yesterday at 8 PM, I was..."
      },
      {
        id: "card-3",
        prompt: "Mencione que seus amigos não estavam na aula ontem.",
        translation: "Eles não estavam na escola ontem.",
        template: "My friends were not at..."
      }
    ]
  },
  {
    id: "A2-w1-d2",
    week: 1,
    day: 2,
    level: "A2",
    title: "Minhas Últimas Férias",
    topic: "Past Vacations",
    grammarTitle: "Past Simple: Regular Verbs",
    grammarStructure: "I traveled... / I visited... / I didn't stay...",
    grammarExplanation: "Verbos regulares ganham '-ed' ou '-d' em frases afirmativas no passado. Negativas usam 'didn't' + verbo no infinitivo.",
    grammarExample: "I visited my family. I didn't watch TV.",
    warmupPrompts: [
      "Fale: 'I traveled to Paris last year.'",
      "Pratique: 'She studied Spanish at school.'",
      "Complete: 'Last summer, I visited...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Fale sobre um local que você visitou nas últimas férias.",
        translation: "Eu visitei uma praia linda no ano passado.",
        template: "Last vacation, I visited..."
      },
      {
        id: "card-2",
        prompt: "Diga que você planejou a viagem inteira sozinho.",
        translation: "Eu planejei toda a viagem.",
        template: "I planned the whole..."
      },
      {
        id: "card-3",
        prompt: "Diga algo que você NÃO fez nas férias (ex: trabalhar).",
        translation: "Eu não trabalhei nas minhas férias.",
        template: "I didn't work during..."
      }
    ]
  },
  {
    id: "A2-w1-d3",
    week: 1,
    day: 3,
    level: "A2",
    title: "Um Fim de Semana Especial",
    topic: "Irregular Past Events",
    grammarTitle: "Past Simple: Irregular Verbs",
    grammarStructure: "I went to... / I bought... / I ate...",
    grammarExplanation: "Verbos irregulares mudam de forma no passado afirmativo. Devem ser memorizados.",
    grammarExample: "I went home. I ate sushi. I had a dog.",
    warmupPrompts: [
      "Fale: 'I went to the cinema on Sunday.'",
      "Pratique: 'I bought a new book yesterday.'",
      "Complete: 'Yesterday, I ate...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga aonde você foi no último domingo.",
        translation: "Eu fui ao shopping com minha família.",
        template: "Last Sunday, I went to..."
      },
      {
        id: "card-2",
        prompt: "Mencione o que você comeu no almoço de ontem.",
        translation: "Eu comi macarrão com carne.",
        template: "For lunch yesterday, I ate..."
      },
      {
        id: "card-3",
        prompt: "Diga que você comprou algo novo recentemente.",
        translation: "Eu comprei um celular novo na semana passada.",
        template: "Last week, I bought..."
      }
    ]
  },
  {
    id: "A2-w2-d1",
    week: 2,
    day: 1,
    level: "A2",
    title: "O Melhor e o Pior",
    topic: "Superlatives",
    grammarTitle: "Superlative Adjectives",
    grammarStructure: "The biggest... / The most beautiful... / The best...",
    grammarExplanation: "Superlativos destacam um item de um grupo total. Adicione '-est' para adjetivos curtos ou 'the most' para longos.",
    grammarExample: "This is the oldest city. He is the best player.",
    warmupPrompts: [
      "Fale: 'Brazil is the largest country in South America.'",
      "Pratique: 'Mount Everest is the highest mountain.'",
      "Complete: 'The most expensive thing I bought...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Mencione qual é a cidade mais bonita na sua opinião.",
        translation: "Rio de Janeiro é a cidade mais linda.",
        template: "In my opinion, Rio is the most beautiful..."
      },
      {
        id: "card-2",
        prompt: "Fale sobre o dia mais feliz da sua vida.",
        translation: "O dia mais feliz da minha vida foi meu casamento.",
        template: "The happiest day of my life was..."
      },
      {
        id: "card-3",
        prompt: "Fale sobre o pior filme que já assistiu.",
        translation: "Aquele foi o pior filme que já vi.",
        template: "That was the worst movie..."
      }
    ]
  },
  {
    id: "A2-w2-d2",
    week: 2,
    day: 2,
    level: "A2",
    title: "Planos para o Futuro Próximo",
    topic: "Future Intentions",
    grammarTitle: "Future with 'Going To'",
    grammarStructure: "I am going to study... / We are going to travel...",
    grammarExplanation: "Use 'Going to' para falar sobre planos futuros já decididos ou intenções claras.",
    grammarExample: "I am going to meet my sister. We are going to buy a house.",
    warmupPrompts: [
      "Fale: 'I am going to study tonight.'",
      "Pratique: 'Are you going to travel next month?'",
      "Complete: 'This weekend, I am going to...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga o que você vai fazer neste sábado.",
        translation: "Eu vou visitar meus avós no sábado.",
        template: "This Saturday, I am going to visit..."
      },
      {
        id: "card-2",
        prompt: "Explique seu próximo passo nos estudos.",
        translation: "Eu vou praticar inglês todos os dias.",
        template: "I am going to practice..."
      },
      {
        id: "card-3",
        prompt: "Diga que não vai cozinhar hoje à noite.",
        translation: "Eu não vou fazer o jantar hoje.",
        template: "I am not going to cook..."
      }
    ]
  },
  {
    id: "A2-w2-d3",
    week: 2,
    day: 3,
    level: "A2",
    title: "Previsões do Clima e Vida",
    topic: "Spontaneous Decisions & Predictions",
    grammarTitle: "Future with 'Will'",
    grammarStructure: "I think it will... / I will help you / I won't go",
    grammarExplanation: "Use 'Will' para previsões gerais, decisões espontâneas na hora da fala, ou promessas.",
    grammarExample: "It will rain tomorrow. I will open the door for you.",
    warmupPrompts: [
      "Fale: 'I think the technology will change everything.'",
      "Pratique: 'Don't worry, I will help you.'",
      "Complete: 'In ten years, I think...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Faça uma previsão simples para o clima de amanhã.",
        translation: "Eu acho que vai fazer sol amanhã.",
        template: "I think it will be sunny..."
      },
      {
        id: "card-2",
        prompt: "Ofereça ajuda voluntária rápida a um colega carregando caixas.",
        translation: "Eu vou carregar essas sacolas para você.",
        template: "I will carry those..."
      },
      {
        id: "card-3",
        prompt: "Diga que você acha que os robôs não substituirão os professores.",
        translation: "Robôs não vão substituir professores.",
        template: "Robots will not replace..."
      }
    ]
  },
  {
    id: "A2-w3-d1",
    week: 3,
    day: 1,
    level: "A2",
    title: "Regras de Sobrevivência e Trabalho",
    topic: "Obligation & Rules",
    grammarTitle: "Modal: Have To / Don't Have To",
    grammarStructure: "I have to work... / She has to study... / You don't have to...",
    grammarExplanation: "Use 'have to' para obrigações externas (regras, leis). Use 'don't have to' para coisas opcionais.",
    grammarExample: "I have to wear a uniform. You don't have to pay now.",
    warmupPrompts: [
      "Fale: 'I have to wake up early on Mondays.'",
      "Pratique: 'Does she have to work today?'",
      "Complete: 'At my job, I have to...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga uma obrigação forte que você tem em seu trabalho ou faculdade.",
        translation: "Eu tenho que enviar relatórios semanais.",
        template: "I have to send..."
      },
      {
        id: "card-2",
        prompt: "Explique que no domingo não é obrigatório acordar cedo para você.",
        translation: "Eu não tenho que acordar cedo no domingo.",
        template: "On Sundays, I don't have to..."
      },
      {
        id: "card-3",
        prompt: "Diga que um médico precisa estudar muito.",
        translation: "Um médico tem que estudar por muitos anos.",
        template: "A doctor has to study..."
      }
    ]
  },
  {
    id: "A2-w3-d2",
    week: 3,
    day: 2,
    level: "A2",
    title: "Dando Conselhos Amigáveis",
    topic: "Giving Recommendations",
    grammarTitle: "Modal: Should / Shouldn't",
    grammarStructure: "You should try... / He shouldn't drink...",
    grammarExplanation: "Use 'should' para dar conselhos, sugestões e recomendações amigáveis.",
    grammarExample: "You should drink more water. You shouldn't eat so much sugar.",
    warmupPrompts: [
      "Fale: 'You should visit Portugal.'",
      "Pratique: 'He should sleep more.'",
      "Complete: 'To learn English, you should...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Dê uma dica de estudo a outro estudante de línguas.",
        translation: "Você deveria assistir filmes com legenda em inglês.",
        template: "You should watch movies with..."
      },
      {
        id: "card-2",
        prompt: "Aconselhe alguém que está se sentindo muito cansado.",
        translation: "Você deveria descansar no fim de semana.",
        template: "You should take a rest on..."
      },
      {
        id: "card-3",
        prompt: "Diga que uma pessoa resfriada não deveria tomar bebidas geladas.",
        translation: "Você não deveria beber água gelada.",
        template: "You shouldn't drink cold..."
      }
    ]
  },
  {
    id: "A2-w3-d3",
    week: 3,
    day: 3,
    level: "A2",
    title: "Como você se sente?",
    topic: "Feelings & Emotions",
    grammarTitle: "Subjective Feelings (Adjectives with -ed and -ing)",
    grammarStructure: "I am bored / This movie is boring",
    grammarExplanation: "-ed descreve a emoção que alguém sente. -ing descreve a característica da coisa que causa a emoção.",
    grammarExample: "I am excited. This game is exciting.",
    warmupPrompts: [
      "Fale: 'I am interested in learning history.'",
      "Pratique: 'This book is very interesting.'",
      "Complete: 'When I work too much, I feel...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga que você está muito interessado em falar inglês fluentemente.",
        translation: "Eu estou interessado em praticar conversação.",
        template: "I am very interested in..."
      },
      {
        id: "card-2",
        prompt: "Descreva um dia cansativo de trabalho.",
        translation: "Meu trabalho é muito cansativo às vezes.",
        template: "My work is very tiring..."
      },
      {
        id: "card-3",
        prompt: "Mencione que você ficou surpreso com uma notícia.",
        translation: "Eu fiquei muito surpreso com o resultado.",
        template: "I was surprised by..."
      }
    ]
  },
  {
    id: "A2-w4-d1",
    week: 4,
    day: 1,
    level: "A2",
    title: "Pedindo e Dando Direções",
    topic: "Asking Directions",
    grammarTitle: "Imperative & Prepositions of Movement",
    grammarStructure: "Go straight / Turn left / Walk past the...",
    grammarExplanation: "Use verbos no imperativo para dar direções de como chegar a um local.",
    grammarExample: "Go straight for two blocks, then turn left at the hospital.",
    warmupPrompts: [
      "Fale: 'Excuse me, where is the hotel?'",
      "Pratique: 'Go straight and turn right.'",
      "Complete: 'The pharmacy is on...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga a alguém para virar à esquerda na próxima esquina.",
        translation: "Vire à esquerda na esquina.",
        template: "Turn left at the next..."
      },
      {
        id: "card-2",
        prompt: "Peça ajuda educada para encontrar a estação de metrô.",
        translation: "Com licença, como eu chego ao metrô?",
        template: "Excuse me, how do I get to..."
      },
      {
        id: "card-3",
        prompt: "Instrua alguém a andar reto por dois quarteirões.",
        translation: "Siga em frente por dois quarteirões.",
        template: "Go straight ahead for..."
      }
    ]
  },
  {
    id: "A2-w4-d2",
    week: 4,
    day: 2,
    level: "A2",
    title: "Notícias e Eventos Recentes",
    topic: "Recent Events",
    grammarTitle: "Present Perfect with 'Just' & 'Already'",
    grammarStructure: "I have just arrived / I have already done...",
    grammarExplanation: "Use Present Perfect com 'just' para ações acabadas de ocorrer, e com 'already' para coisas já finalizadas.",
    grammarExample: "I have just sent the email. She has already finished the homework.",
    warmupPrompts: [
      "Fale: 'I have just finished eating.'",
      "Pratique: 'I have already watched that show.'",
      "Complete: 'I have just received a message...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga que você acabou de entrar na aula de inglês.",
        translation: "Eu acabei de começar minha sessão.",
        template: "I have just started my..."
      },
      {
        id: "card-2",
        prompt: "Diga que você já lavou toda a louça da pia hoje.",
        translation: "Eu já lavei os pratos.",
        template: "I have already washed..."
      },
      {
        id: "card-3",
        prompt: "Diga que acabou de receber uma ligação telefônica importante.",
        translation: "Eu acabei de receber uma ligação.",
        template: "I have just received a..."
      }
    ]
  },
  {
    id: "A2-w4-d3",
    week: 4,
    day: 3,
    level: "A2",
    title: "Revisão Geral e Fluência",
    topic: "General Revision",
    grammarTitle: "Mixed Review (Present, Past, Future)",
    grammarStructure: "I am... / I went... / I will go...",
    grammarExplanation: "Combinando os tempos verbais básicos para conversas fluidas.",
    grammarExample: "I live here, last year I went to New York, and next year I will visit Paris.",
    warmupPrompts: [
      "Fale: 'I studied hard today.'",
      "Pratique: 'Tomorrow is another day to speak.'",
      "Complete: 'I like English because...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Fale de onde você é, o que fez ontem e o que fará amanhã.",
        translation: "Eu sou de [Cidade], ontem estudei e amanhã vou descansar.",
        template: "I am from... Yesterday I... and tomorrow I am going to..."
      },
      {
        id: "card-2",
        prompt: "Diga que sua meta de inglês é falar sem medo.",
        translation: "Minha meta de inglês é falar fluentemente.",
        template: "My goal in English is to..."
      },
      {
        id: "card-3",
        prompt: "Parabenize seu próprio esforço até o final desta fase.",
        translation: "Eu concluí a fase A2!",
        template: "I have finished the A2..."
      }
    ]
  },

  // ==================== LEVEL B1 ====================
  {
    id: "B1-w1-d1",
    week: 1,
    day: 1,
    level: "B1",
    title: "Minhas Viagens e Países",
    topic: "Life Experiences",
    grammarTitle: "Present Perfect with 'Ever' & 'Never'",
    grammarStructure: "Have you ever been to... ? / I have never tried...",
    grammarExplanation: "O Present Perfect liga o passado com o presente. Usamos 'ever' em perguntas sobre experiências de vida e 'never' em negativas.",
    grammarExample: "Have you ever seen a bear? I have never been to London.",
    warmupPrompts: [
      "Fale: 'Have you ever traveled to Europe?'",
      "Pratique: 'I have never tried spicy Mexican food.'",
      "Complete: 'I have never visited...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Pergunte a um colega se ele já comeu comida exótica.",
        translation: "Você já comeu comida japonesa?",
        template: "Have you ever eaten..."
      },
      {
        id: "card-2",
        prompt: "Mencione um país frio que você nunca visitou na vida.",
        translation: "Eu nunca estive no Canadá.",
        template: "I have never been to..."
      },
      {
        id: "card-3",
        prompt: "Diga que você já assistiu a um show internacional.",
        translation: "Eu já assisti a um show de rock.",
        template: "I have already watched a..."
      }
    ]
  },
  {
    id: "B1-w1-d2",
    week: 1,
    day: 2,
    level: "B1",
    title: "Minha Carreira e Passado",
    topic: "Career Timeline",
    grammarTitle: "Present Perfect vs Past Simple",
    grammarStructure: "I have worked as... / I started in...",
    grammarExplanation: "Use Present Perfect para ações com tempo indefinido ligado ao presente, e Past Simple para eventos em um tempo específico do passado.",
    grammarExample: "I have worked in tech for 5 years. I graduated in 2018.",
    warmupPrompts: [
      "Fale: 'I have been a programmer since 2020.'",
      "Pratique: 'I worked at a big bank last year.'",
      "Complete: 'In my career, I have already...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Fale qual é sua área de atuação profissional de modo geral.",
        translation: "Eu venho trabalhando na área de tecnologia.",
        template: "I have worked in..."
      },
      {
        id: "card-2",
        prompt: "Indique o ano exato em que você começou seu primeiro emprego.",
        translation: "Eu comecei meu primeiro emprego em [Ano].",
        template: "I started my first job in..."
      },
      {
        id: "card-3",
        prompt: "Mencione uma grande conquista de carreira que você concluiu.",
        translation: "Eu liderei um projeto importante.",
        template: "I have managed an important..."
      }
    ]
  },
  {
    id: "B1-w1-d3",
    week: 1,
    day: 3,
    level: "B1",
    title: "Meus Hábitos Duradouros",
    topic: "Habits and Duration",
    grammarTitle: "Present Perfect with 'For' & 'Since'",
    grammarStructure: "I have lived here for... / I have known her since...",
    grammarExplanation: "Use 'for' para indicar duração de tempo (anos, meses) e 'since' para indicar o ponto de início (data, ano, evento).",
    grammarExample: "I have studied here for two years. I have worked here since June.",
    warmupPrompts: [
      "Fale: 'I have known my best friend for ten years.'",
      "Pratique: 'She has played the piano since childhood.'",
      "Complete: 'I have been studying English since...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga há quantos anos você mora na sua casa atual.",
        translation: "Eu moro nesta casa há cinco anos.",
        template: "I have lived in this house for..."
      },
      {
        id: "card-2",
        prompt: "Fale desde qual ano você estuda ou trabalha no que faz hoje.",
        translation: "Eu trabalho nesta empresa desde 2021.",
        template: "I have worked here since..."
      },
      {
        id: "card-3",
        prompt: "Diga que possui seu item eletrônico favorito há meses.",
        translation: "Eu tenho este notebook há muitos meses.",
        template: "I have had this laptop for..."
      }
    ]
  },

  // ==================== LEVEL B2 ====================
  {
    id: "B2-w1-d1",
    week: 1,
    day: 1,
    level: "B2",
    title: "Situações Hipotéticas e Decisões",
    topic: "Hypothetical Scenarios",
    grammarTitle: "Second Conditional",
    grammarStructure: "If I had... I would... / If I were you, I would...",
    grammarExplanation: "O Second Conditional fala sobre situações hipotéticas ou improváveis no presente/futuro. Usa-se Past Simple com 'if' e 'would' + verbo na cláusula principal.",
    grammarExample: "If I won the lottery, I would travel. If I were you, I would study harder.",
    warmupPrompts: [
      "Fale: 'If I were rich, I would buy an island.'",
      "Pratique: 'If she had time, she would join us.'",
      "Complete: 'If I could speak English fluently right now, I would...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Diga o que você faria se encontrasse uma carteira na rua.",
        translation: "Se eu encontrasse uma carteira, eu a devolveria.",
        template: "If I found a wallet, I would..."
      },
      {
        id: "card-2",
        prompt: "Dê um conselho hipotético de vida para um amigo.",
        translation: "Se eu fosse você, eu investiria esse dinheiro.",
        template: "If I were you, I would..."
      },
      {
        id: "card-3",
        prompt: "Imagine se sua empresa lhe desse um mês de folga remunerada.",
        translation: "Se eu tivesse um mês de folga, eu viajaria para a Europa.",
        template: "If I had a month off, I would..."
      }
    ]
  },
  {
    id: "B2-w1-d2",
    week: 1,
    day: 2,
    level: "B2",
    title: "Ações Recentes e Processos",
    topic: "Actions over Time",
    grammarTitle: "Present Perfect Continuous",
    grammarStructure: "I have been working... / Have you been sleeping well?",
    grammarExplanation: "Use o Present Perfect Continuous para focar na duração e continuidade de um processo que começou no passado e ainda continua ou terminou agora.",
    grammarExample: "I have been reading this book for a week. She has been practicing English since morning.",
    warmupPrompts: [
      "Fale: 'I have been working on a big project lately.'",
      "Pratique: 'How long have you been studying English?'",
      "Complete: 'Recently, I have been playing...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Fale sobre uma atividade física que você vem fazendo regularmente nas últimas semanas.",
        translation: "Eu venho correndo no parque de manhã.",
        template: "Lately, I have been running..."
      },
      {
        id: "card-2",
        prompt: "Comente sobre seus hábitos de sono recentemente.",
        translation: "Eu venho dormindo muito tarde.",
        template: "Recently, I have been sleeping..."
      },
      {
        id: "card-3",
        prompt: "Explique o que você tem feito no computador nas últimas horas.",
        translation: "Eu venho programando este sistema.",
        template: "I have been coding..."
      }
    ]
  },
  {
    id: "B2-w1-d3",
    week: 1,
    day: 3,
    level: "B2",
    title: "Antes de Tudo Acontecer",
    topic: "Past Timelines",
    grammarTitle: "Past Perfect",
    grammarStructure: "I had already left when... / Had you finished... ?",
    grammarExplanation: "Use o Past Perfect para descrever uma ação que aconteceu ANTES de outra ação no passado.",
    grammarExample: "When I arrived at the station, the train had already left.",
    warmupPrompts: [
      "Fale: 'I had prepared dinner before they arrived.'",
      "Pratique: 'Had you studied English before joining this course?'",
      "Complete: 'When I got to work, I realized I had...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Explique que você já tinha tomado café antes de começar a trabalhar ontem.",
        translation: "Eu já tinha tomado café quando comecei a trabalhar.",
        template: "I had already had breakfast when I started..."
      },
      {
        id: "card-2",
        prompt: "Diga que quando chegou ao cinema, o filme já tinha começado.",
        translation: "O filme já tinha começado quando cheguei.",
        template: "When I arrived, the movie had already..."
      },
      {
        id: "card-3",
        prompt: "Indique que você nunca tinha falado com um nativo antes de ontem.",
        translation: "Eu nunca tinha falado com um nativo.",
        template: "Before yesterday, I had never spoken..."
      }
    ]
  },

  // ==================== LEVEL C1 ====================
  {
    id: "C1-w1-d1",
    week: 1,
    day: 1,
    level: "C1",
    title: "Arrependimentos e Opções Passadas",
    topic: "Past Regrets",
    grammarTitle: "Third Conditional",
    grammarStructure: "If I had studied... I would have passed...",
    grammarExplanation: "O Third Conditional trata de situações imaginárias do passado. Como o passado não pode ser alterado, expressa hipóteses impossíveis.",
    grammarExample: "If I had taken that flight, I would have been in New York. If it had rained, we would have stayed.",
    warmupPrompts: [
      "Fale: 'If I had known, I would have helped you.'",
      "Pratique: 'If he had accepted the offer, his life would have been different.'",
      "Complete: 'If I had studied English 5 years ago, I would have...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Comente sobre uma decisão de estudos no passado e o que teria mudado.",
        translation: "Se eu tivesse estudado tecnologia antes, eu teria conseguido o emprego.",
        template: "If I had studied tech earlier, I would have..."
      },
      {
        id: "card-2",
        prompt: "Fale o que teria acontecido se você tivesse acordado duas horas mais cedo hoje.",
        translation: "Se eu tivesse acordado antes, eu teria feito exercícios.",
        template: "If I had woken up earlier today, I would have..."
      },
      {
        id: "card-3",
        prompt: "Imagine que um amigo seu não veio. Diga o que faria se ele tivesse vindo.",
        translation: "Se ele tivesse vindo, nós teríamos jantado juntos.",
        template: "If he had come, we would have..."
      }
    ]
  },
  {
    id: "C1-w1-d2",
    week: 1,
    day: 2,
    level: "C1",
    title: "Condicionais Mistas de Impacto",
    topic: "Alternative Realities",
    grammarTitle: "Mixed Conditionals",
    grammarStructure: "If I had lived in London, I would speak better now...",
    grammarExplanation: "Condicionais mistas misturam tempos verbais (geralmente passado e presente). Mostram como uma ação passada afetaria nossa realidade hoje.",
    grammarExample: "If I had bought that house, I would be rich today.",
    warmupPrompts: [
      "Fale: 'If I had moved to Canada, I would be freezing today.'",
      "Pratique: 'If she had studied law, she would be a lawyer now.'",
      "Complete: 'If I had married a native speaker, I would...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Fale de uma ação passada hipotética e como ela afetaria sua carreira no presente.",
        translation: "Se eu tivesse feito aquele curso, eu seria um gerente hoje.",
        template: "If I had taken that course, I would be a manager now..."
      },
      {
        id: "card-2",
        prompt: "Discorra sobre como morar fora teria impactado sua fluência atual.",
        translation: "Se eu tivesse morado fora, eu falaria inglês perfeitamente hoje.",
        template: "If I had lived abroad, I would speak perfectly..."
      },
      {
        id: "card-3",
        prompt: "Imagine se você tivesse nascido em outro país.",
        translation: "Se eu tivesse nascido no Japão, eu falaria japonês agora.",
        template: "If I had been born in Japan, I would speak..."
      }
    ]
  },
  {
    id: "C1-w1-d3",
    week: 1,
    day: 3,
    level: "C1",
    title: "Desejos e Críticas no Presente",
    topic: "Wishes & Frustrations",
    grammarTitle: "I Wish / If Only",
    grammarStructure: "I wish I were... / If only we could... / I wish you would stop...",
    grammarExplanation: "Use 'I wish' ou 'If only' + Past Simple para expressar desejos de que a situação presente fosse diferente. Use com 'would' para reclamar de hábitos de outros.",
    grammarExample: "I wish I spoke English. If only I could fly. I wish you wouldn't make so much noise.",
    warmupPrompts: [
      "Fale: 'I wish I had a bigger house.'",
      "Pratique: 'If only I knew the answer to this problem.'",
      "Complete: 'I wish the government would...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Expresse seu desejo de ter mais tempo livre hoje em dia.",
        translation: "Eu gostaria de ter mais tempo livre para mim.",
        template: "I wish I had more free time to..."
      },
      {
        id: "card-2",
        prompt: "Expresse uma leve frustração com o clima atual.",
        translation: "Quem dera não estivesse chovendo tanto hoje.",
        template: "If only it weren't raining so much today..."
      },
      {
        id: "card-3",
        prompt: "Peça indiretamente que alguém mude um hábito chato.",
        translation: "Eu gostaria que você parasse de falar tão alto.",
        template: "I wish you would stop speaking so..."
      }
    ]
  },

  // ==================== LEVEL C2 ====================
  {
    id: "C2-w1-d1",
    week: 1,
    day: 1,
    level: "C2",
    title: "Expressão Abstrata e Metáforas",
    topic: "Abstract Thinking & Nuance",
    grammarTitle: "Advanced Metaphors & Double Meanings",
    grammarStructure: "It's a double-edged sword... / Read between the lines...",
    grammarExplanation: "No nível C2, dominar expressões idiomáticas complexas e metáforas abstratas é essencial para a fluência nativa.",
    grammarExample: "This decision is a double-edged sword; we gain speed but lose control.",
    warmupPrompts: [
      "Fale: 'We need to think outside the box to bypass this bottleneck.'",
      "Pratique: 'Let's not cry over spilled milk and focus on the future.'",
      "Complete: 'When talking to stakeholders, you must read between...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Descreva uma situação complexa do mercado como 'uma faca de dois gumes'.",
        translation: "Trabalhar de casa é uma faca de dois gumes.",
        template: "Remote work is a double-edged sword because..."
      },
      {
        id: "card-2",
        prompt: "Fale sobre a importância de ler as entrelinhas nas negociações.",
        translation: "Nas negociações, você precisa ler as entrelinhas.",
        template: "During negotiations, it is paramount to read between..."
      },
      {
        id: "card-3",
        prompt: "Use a metáfora de 'morder mais do que pode mastigar' sobre excesso de tarefas.",
        translation: "Eu assumi mais responsabilidades do que conseguia lidar.",
        template: "I bit off more than I could chew when I..."
      }
    ]
  },
  {
    id: "C2-w1-d2",
    week: 1,
    day: 2,
    level: "C2",
    title: "Nuances de Registro e Tom",
    topic: "Register & Diplomacy",
    grammarTitle: "Euphemisms and Diplomatic Language",
    grammarStructure: "With all due respect... / I'm afraid I cannot agree...",
    grammarExplanation: "No nível de maestria, ajustar o tom de forma diplomática permite discordar com elegância e profissionalismo absoluto.",
    grammarExample: "I appreciate your insight; however, I'm afraid that doesn't align with our current strategy.",
    warmupPrompts: [
      "Fale: 'With all due respect, your proposal lacks analytical backing.'",
      "Pratique: 'I'm afraid I must beg to differ on this particular issue.'",
      "Complete: 'I see your point, but we must take into consideration...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Discorde polidamente de um diretor em uma reunião hipotética.",
        translation: "Com todo o respeito, discordo da sua conclusão.",
        template: "With all due respect, I beg to differ because..."
      },
      {
        id: "card-2",
        prompt: "Diga que infelizmente o orçamento atual não permite fazer investimentos caros.",
        translation: "Receio que nosso orçamento não comporte esse investimento.",
        template: "I'm afraid our current budget cannot accommodate..."
      },
      {
        id: "card-3",
        prompt: "Apresente um contra-ponto construtivo a uma ideia arriscada.",
        translation: "Entendo sua preocupação, no entanto, nós deveríamos considerar...",
        template: "I completely understand your perspective; however, we ought to consider..."
      }
    ]
  },
  {
    id: "C2-w1-d3",
    week: 1,
    day: 3,
    level: "C2",
    title: "Persuasão e Retórica Avançada",
    topic: "Persuasion & High-level Discourse",
    grammarTitle: "Cleft Sentences & Inversion for Emphasis",
    grammarStructure: "What we really need is... / Seldom have I seen...",
    grammarExplanation: "Cleft sentences (frases clivadas) e Inversão são estruturas literárias que dão ênfase dramática e formal à sua fala.",
    grammarExample: "What we need is commitment. Seldom have I witnessed such a brilliant presentation.",
    warmupPrompts: [
      "Fale: 'What we must focus on is quality control.'",
      "Pratique: 'Never before had I encountered such a resilient team.'",
      "Complete: 'What I truly value in a leader is...'"
    ],
    grammarCards: [
      {
        id: "card-1",
        prompt: "Fale com forte ênfase o que sua empresa mais necessita no momento.",
        translation: "O que nós mais precisamos é de inovação tecnológica.",
        template: "What our company desperately needs is..."
      },
      {
        id: "card-2",
        prompt: "Faça uma frase enfática expressando que raramente viu um projeto tão promissor.",
        translation: "Raramente eu vi um projeto tão bom.",
        template: "Seldom have I witnessed such a promising..."
      },
      {
        id: "card-3",
        prompt: "Enfatize seu valor profissional principal para fechar um contrato.",
        translation: "O que eu ofereço é dedicação e experiência.",
        template: "What I bring to the table is..."
      }
    ]
  }
];

// Helper to fill the remaining sessions for each level dynamically so every level has exactly 12 sessions
// (4 weeks * 3 days = 12 sessions per level, giving a perfect fully operational flow for testing).
export function getSessionsForLevel(level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"): Session[] {
  const existing = STUDY_SCHEDULE.filter(s => s.level === level);
  
  if (existing.length === 12) {
    return existing;
  }

  // Generate mock sessions based on existing ones to reach exactly 12 lessons
  const totalNeeded = 12;
  const result = [...existing];
  const templateBase = existing[0] || STUDY_SCHEDULE[0];

  for (let i = existing.length; i < totalNeeded; i++) {
    const week = Math.floor(i / 3) + 1;
    const day = (i % 3) + 1;
    
    // Dynamic titles and topics
    const dynamicTopics: Record<string, string[]> = {
      A1: ["Family Life", "Eating Out", "Daily Routine", "Holiday Celebrations", "My Hometown", "Hobbies", "Weather"],
      A2: ["Hotel Bookings", "My First Job", "Shopping for Clothes", "Sports & Wellness", "Past Memories", "Cooking Recipes"],
      B1: ["Technology Trends", "Environmental Issues", "Favorite Movies", "Global Cultures", "Public Transport", "Future Ambitions"],
      B2: ["Digital Marketing", "Social Media Ethics", "Healthy Habits", "Economic Predictions", "Art and Philosophy", "Workplace Stress"],
      C1: ["Macroeconomics", "Artificial Intelligence Ethics", "Corporate Strategy", "Global Warming Politics", "Human Psychology"],
      C2: ["Geopolitical Relations", "Advanced Literary Criticism", "Philosophical Existentialism", "Crisis Management Strategy", "Quantum Physics Basics"]
    };

    const levelTopics = dynamicTopics[level] || ["General Conversation"];
    const topic = levelTopics[i % levelTopics.length];
    
    result.push({
      ...templateBase,
      id: `${level}-w${week}-d${day}`,
      week,
      day,
      title: `${topic} - Prática ${day}`,
      topic,
      grammarTitle: `Estrutura de Nível ${level} - Aula ${i+1}`,
      grammarStructure: templateBase.grammarStructure,
      grammarExplanation: `Esta aula aprofunda a conversação prática usando o vocabulário e contexto de ${topic} no nível ${level}.`,
      grammarExample: templateBase.grammarExample,
      warmupPrompts: [
        `Fale em voz alta: 'I think practicing ${topic} in English is very useful.'`,
        `Pronuncie de forma natural: 'This topic expands my professional vocabulary.'`,
        `Complete: 'In my experience, ${topic} is...'`
      ],
      grammarCards: templateBase.grammarCards.map((card, idx) => ({
        ...card,
        id: `gen-card-${idx}`,
        prompt: `Fale sobre ${topic} usando a estrutura padrão de nível ${level}.`,
        translation: `[Frase de exemplo traduzida para ${topic}]`,
        template: card.template
      }))
    });
  }

  return result.sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return a.day - b.day;
  });
}

// Global list of all levels for progress navigation
export const CEFR_LEVELS = [
  { code: "A1", label: "A1 (Iniciante I)", color: "emerald", desc: "Compreende e usa expressões cotidianas e frases simples." },
  { code: "A2", label: "A2 (Iniciante II)", color: "teal", desc: "Comunica-se em tarefas simples e rotineiras." },
  { code: "B1", label: "B1 (Intermediário I)", color: "cyan", desc: "Compreende os pontos principais sobre assuntos familiares." },
  { code: "B2", label: "B2 (Intermediário II)", color: "sky", desc: "Compreende ideias principais de textos complexos e conversa fluentemente." },
  { code: "C1", label: "C1 (Avançado I)", color: "indigo", desc: "Compreende uma vasta gama de textos longos e exige esforço mínimo." },
  { code: "C2", label: "C2 (Avançado II)", color: "violet", desc: "Compreende com facilidade praticamente tudo o que ouve ou lê." }
] as const;
