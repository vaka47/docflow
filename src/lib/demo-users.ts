export type DemoUser = {
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EDITOR" | "CROWD" | "LEGAL" | "REQUESTER";
  team: string;
  extraRoles?: string[];
};

export const demoUsers: DemoUser[] = [
  { name: "Админ Демо", email: "admin@docflow.local", role: "ADMIN", team: "Program Management", extraRoles: ["ADMIN"] },
  { name: "Анна Смирнова", email: "anna.smirnova@docflow.local", role: "MANAGER", team: "Program Management" },
  { name: "Илья Петров", email: "ilya.petrov@docflow.local", role: "EDITOR", team: "Docs Production" },
  { name: "Юлия Волкова", email: "yulia.volkova@docflow.local", role: "LEGAL", team: "Compliance" },
  { name: "Алексей Новиков", email: "alexey.novikov@docflow.local", role: "MANAGER", team: "Workflow Ops" },
  { name: "Ольга Морозова", email: "olga.morozova@docflow.local", role: "EDITOR", team: "Alice Docs" },
  { name: "Павел Орлов", email: "pavel.orlov@docflow.local", role: "EDITOR", team: "Search Docs" },
  { name: "Мария Кузнецова", email: "maria.kuznetsova@docflow.local", role: "LEGAL", team: "Legal" },
  { name: "Игорь Денисов", email: "igor.denisov@docflow.local", role: "CROWD", team: "Crowd Pool" },
  { name: "Елена Соколова", email: "elena.sokolova@docflow.local", role: "EDITOR", team: "Market Docs" },
  { name: "Дмитрий Федоров", email: "dmitry.fedorov@docflow.local", role: "REQUESTER", team: "Taxi" },
  { name: "Сергей Волков", email: "sergey.volkov@docflow.local", role: "LEGAL", team: "Compliance" },
  { name: "Юрий Жуков", email: "yuriy.zhukov@docflow.local", role: "MANAGER", team: "Delivery Ops" },
  { name: "Наталья Лебедева", email: "natalia.lebedeva@docflow.local", role: "EDITOR", team: "Docs Production" },
  { name: "Кирилл Ковалев", email: "kirill.kovalev@docflow.local", role: "CROWD", team: "Crowd QA" },
  { name: "Виктория Белоусова", email: "viktoria.belousova@docflow.local", role: "REQUESTER", team: "Market" },
  { name: "Максим Андреев", email: "maxim.andreev@docflow.local", role: "MANAGER", team: "Taxi Docs" },
  { name: "Софья Громова", email: "sofya.gromova@docflow.local", role: "EDITOR", team: "Alice Docs" },
  { name: "Артем Соловьев", email: "artem.solovyev@docflow.local", role: "EDITOR", team: "Search Docs" },
  { name: "Роман Титов", email: "roman.titov@docflow.local", role: "CROWD", team: "Crowd Pool" },
  { name: "Ксения Попова", email: "ksenia.popova@docflow.local", role: "REQUESTER", team: "Alice" },
  { name: "Евгений Сидоров", email: "evgeny.sidorov@docflow.local", role: "MANAGER", team: "Program Management" },
  { name: "Людмила Орлова", email: "lyudmila.orlova@docflow.local", role: "EDITOR", team: "Market Docs" },
  { name: "Галина Фролова", email: "galina.frolova@docflow.local", role: "LEGAL", team: "Legal" },
  { name: "Федор Волков", email: "fedor.volkov@docflow.local", role: "REQUESTER", team: "Search" },
  { name: "Станислав Логинов", email: "stanislav.loginov@docflow.local", role: "CROWD", team: "Crowd QA" },
  { name: "Татьяна Романова", email: "tatyana.romanova@docflow.local", role: "EDITOR", team: "Docs Production" },
  { name: "Никита Егоров", email: "nikita.egorov@docflow.local", role: "CROWD", team: "Crowd Pool" },
  { name: "Инна Белова", email: "inna.belova@docflow.local", role: "REQUESTER", team: "Cloud" },
  { name: "Георгий Захаров", email: "georgy.zakharov@docflow.local", role: "MANAGER", team: "Workflow Ops" },
  { name: "Вера Антонова", email: "vera.antonova@docflow.local", role: "LEGAL", team: "Compliance" },
  { name: "Леонид Носов", email: "leonid.nosov@docflow.local", role: "EDITOR", team: "Search Docs" },
  { name: "Алла Блинова", email: "alla.blinova@docflow.local", role: "EDITOR", team: "Market Docs" },
  { name: "Петр Гусев", email: "petr.gusev@docflow.local", role: "REQUESTER", team: "Taxi" },
  { name: "Маргарита Миронова", email: "margarita.mironova@docflow.local", role: "LEGAL", team: "Legal" },
  { name: "Олег Фомин", email: "oleg.fomin@docflow.local", role: "CROWD", team: "Crowd QA" },
  { name: "Диана Чернова", email: "diana.chernova@docflow.local", role: "EDITOR", team: "Alice Docs" },
  { name: "Иван Прохоров", email: "ivan.prokhorov@docflow.local", role: "MANAGER", team: "Delivery Ops" },
  { name: "Лариса Савельева", email: "larisa.savelyeva@docflow.local", role: "REQUESTER", team: "Market" },
  { name: "Семен Грачев", email: "semen.grachev@docflow.local", role: "CROWD", team: "Crowd Pool" },
  { name: "Светлана Миронова", email: "svetlana.mironova@docflow.local", role: "REQUESTER", team: "Cloud" },
];
