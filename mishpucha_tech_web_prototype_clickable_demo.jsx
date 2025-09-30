import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Users, Calendar, MessageCircle, Heart, MapPin, ChevronRight, ChevronLeft, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/**
 * MishpuchaTech – lightweight, responsive web demo
 * Goal: let you tap through the main user flows on iPhone/phone.
 * No backend — only mocked data/state to simulate interactions.
 */

const container = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#FDF6F0] border-b">
      <div className="w-8">{onBack && (
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-neutral-100">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}</div>
      <div className="text-lg font-semibold text-neutral-900">{title}</div>
      <div className="w-8 flex justify-end">{right}</div>
    </div>
  );
}

function BottomNav({ current, setCurrent }: { current: string; setCurrent: (s: string) => void }) {
  const items = [
    { key: "home", label: "Главная", icon: Home },
    { key: "tree", label: "Древо", icon: Users },
    { key: "calendar", label: "Календарь", icon: Calendar },
    { key: "groups", label: "Группы", icon: MessageCircle },
    { key: "profile", label: "Профиль", icon: User },
  ];
  return (
    <div className="sticky bottom-0 z-10 grid grid-cols-5 bg-white/90 backdrop-blur border-t">
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setCurrent(key)}
          className={`flex flex-col items-center py-2 ${current === key ? "text-[#A65A2E]" : "text-neutral-500"}`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[11px]">{label}</span>
        </button>
      ))}
    </div>
  );
}

function InviteFlow({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  return (
    <div className="p-4 space-y-4">
      <TopBar title="Вход по приглашению" />
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        <p className="text-sm text-neutral-700">Введите код инвайта, чтобы попасть в закрытое сообщество MishpuchaTech.</p>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Код приглашения" />
        <Button className="w-full bg-[#E08E45] hover:bg-[#cf7b35]" onClick={onDone}>
          Продолжить
        </Button>
      </motion.div>
    </div>
  );
}

function HomeScreen({ go }: { go: (s: string) => void }) {
  return (
    <div className="p-4 pb-24">
      <TopBar title="MishpuchaTech" right={<Heart className="w-5 h-5" />} />
      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=200&auto=format&fit=crop" alt="avatar" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <div className="font-semibold">Давид Абрамов</div>
                <div className="text-xs text-neutral-500">Род: Абрамовы • Москва</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => go("wedding") } className="rounded-2xl p-4 bg-white shadow">
            <div className="font-semibold">Свадьба</div>
            <div className="text-xs text-neutral-500">Создать приглашение</div>
          </button>
          <button onClick={() => go("brit") } className="rounded-2xl p-4 bg-white shadow">
            <div className="font-semibold">Брит Мила</div>
            <div className="text-xs text-neutral-500">Обрезание мальчика</div>
          </button>
          <button onClick={() => go("bar") } className="rounded-2xl p-4 bg-white shadow">
            <div className="font-semibold">Бар Мицва</div>
            <div className="text-xs text-neutral-500">13 лет • молитва + банкет</div>
          </button>
          <button onClick={() => go("mourning") } className="rounded-2xl p-4 bg-white shadow">
            <div className="font-semibold">Траур</div>
            <div className="text-xs text-neutral-500">Похороны • 7 • 40 • год</div>
          </button>
          <button onClick={() => go("synagogue") } className="rounded-2xl p-4 bg-white shadow">
            <div className="font-semibold">Синагоги</div>
            <div className="text-xs text-neutral-500">Расписания и подписки</div>
          </button>
          <button onClick={() => go("feed") } className="rounded-2xl p-4 bg-white shadow">
            <div className="font-semibold">Лента</div>
            <div className="text-xs text-neutral-500">События семьи и общины</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function TreeScreen() {
  const [relatives, setRelatives] = useState(["Родители", "Дети", "Сёстры/Братья"]);
  return (
    <div className="p-4 pb-24">
      <TopBar title="Семейное древо" />
      <div className="space-y-3">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="text-sm text-neutral-700 mb-2">Классическое отображение (поколения)</div>
          <div className="grid grid-cols-3 gap-2">
            {["Дедушка", "Бабушка", "Отец", "Мать", "Я", "Сестра", "Брат"].map((n, i) => (
              <div key={i} className="rounded-xl bg-[#FFF] border p-2 text-center text-xs">{n}</div>
            ))}
          </div>
        </CardContent></Card>
        <div className="flex gap-2">
          <Button className="bg-[#E08E45] hover:bg-[#cf7b35]"><Plus className="w-4 h-4 mr-1"/>Добавить родственника</Button>
          <Button variant="outline">Фильтры</Button>
        </div>
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="text-sm font-medium mb-2">Разделы</div>
          <div className="flex flex-wrap gap-2">
            {relatives.map((r, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-neutral-100 text-xs">{r}</span>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}

function GroupsScreen({ openChat }: { openChat: () => void }) {
  return (
    <div className="p-4 pb-24">
      <TopBar title="Группы" />
      <div className="space-y-3">
        {[{t:"Семья Абрамовых", preview:"Фото с кухни у бабушки"}, {t:"Подготовка свадьбы", preview:"Закрываем список гостей"}, {t:"Соседи дача", preview:"Субботняя мангал-встреча"}].map((g, i) => (
          <button key={i} onClick={openChat} className="w-full text-left bg-white p-4 rounded-2xl shadow flex items-center justify-between">
            <div>
              <div className="font-medium">{g.t}</div>
              <div className="text-xs text-neutral-500">{g.preview}</div>
            </div>
            <ChevronRight className="w-4 h-4"/>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatScreen({ onBack }: { onBack: () => void }) {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([
    { from: "Сара", text: "Shabbat Shalom!" },
    { from: "Даниэль", text: "Доброе утро ☀️" },
  ]);
  const album = [
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=300&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529336953121-c8f6c0f0f68f?q=80&w=300&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=300&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=300&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=300&auto=format&fit=crop",
  ];
  return (
    <div className="p-0 pb-20">
      <TopBar title="Семья Абрамовых" onBack={onBack} right={<i className="text-xs text-neutral-500">медиа: {album.length} фото</i>} />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="text-xs text-neutral-500">Альбом</div>
          <div className="grid grid-cols-3 gap-2">
            {album.map((src, i)=> (
              <img key={i} src={src} className="w-full h-20 object-cover rounded-xl" />
            ))}
          </div>
        </div>
        {items.map((m, i) => (
          <div key={i} className="bg-white p-3 rounded-2xl shadow max-w-[80%]"> <div className="text-xs text-neutral-500 mb-1">{m.from}</div>{m.text}</div>
        ))}
      </div>
      <div className="fixed bottom-14 left-0 right-0 px-4">
        <div className="flex items-center gap-2 bg-white rounded-2xl shadow p-2">
          <Input placeholder="Сообщение" value={msg} onChange={(e)=>setMsg(e.target.value)} className="border-0 focus-visible:ring-0"/>
          <Button onClick={()=>{ if(!msg) return; setItems([...items, { from:"Вы", text: msg }]); setMsg(""); }} className="bg-[#E08E45] hover:bg-[#cf7b35]">Отправить</Button>
        </div>
      </div>
    </div>
  );
}

function CalendarScreen({ goToWedding }: { goToWedding: () => void }) {
  return (
    <div className="p-4 pb-24">
      <TopBar title="Календарь" />
      <div className="space-y-3">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="text-sm text-neutral-700">Ближайшие события</div>
          <div className="mt-3 space-y-2">
            <button onClick={goToWedding} className="w-full bg-white p-3 rounded-xl border flex items-center justify-between">
              <div>
                <div className="font-medium">Свадьба Яэль & Давид</div>
                <div className="text-xs text-neutral-500">15 августа • 17:00 • Парадайз</div>
              </div>
              <ChevronRight className="w-4 h-4"/>
            </button>
            <div className="w-full bg-white p-3 rounded-xl border">
              <div className="font-medium">Брит Мила — Аарон</div>
              <div className="text-xs text-neutral-500">22 августа • 09:30 • Синагога №3</div>
            </div>
            <div className="w-full bg-white p-3 rounded-xl border">
              <div className="font-medium">Бар Мицва — Ноах</div>
              <div className="text-xs text-neutral-500">5 сентября • 10:00 молитва • 13:00 банкет</div>
            </div>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}

function WeddingScreen({ onBack }: { onBack: () => void }) {
  const [rsvp, setRsvp] = useState<string|undefined>();
  return (
    <div className="p-4 pb-24">
      <TopBar title="Свадьба" onBack={onBack} />
      <Card className="rounded-2xl"><CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=180&auto=format&fit=crop" className="w-16 h-16 rounded-full object-cover"/>
          <div>
            <div className="font-semibold text-lg">Яэль & Давид</div>
            <div className="text-xs text-neutral-500">15 августа • 17:00 • Парадайз</div>
            <div className="text-xs text-neutral-500 flex items-center gap-1"><MapPin className="w-3 h-3"/>Москва</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Иду", "Не иду", "Под вопросом"].map(opt => (
            <button key={opt} onClick={() => setRsvp(opt)} className={`p-3 rounded-xl border ${rsvp===opt?"border-[#E08E45] bg-orange-50":""}`}>{opt}</button>
          ))}
        </div>
        {rsvp && (
          <div className="flex items-center gap-2 text-sm text-green-700"><Check className="w-4 h-4"/>Ваш статус обновлён: {rsvp}</div>
        )}
        <Button className="w-full bg-[#E08E45] hover:bg-[#cf7b35]">Открыть чат события</Button>
      </CardContent></Card>
    </div>
  );
}

function MourningScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-4 pb-24">
      <TopBar title="Траур" onBack={onBack} />
      <Card className="rounded-2xl"><CardContent className="p-4 space-y-3">
        <div className="text-sm text-neutral-700">Внесено раввином</div>
        <div className="bg-white rounded-xl border p-3">
          <div className="font-medium">Похороны</div>
          <div className="text-xs text-neutral-500">Сегодня • 15:00 • Старое кладбище</div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-white rounded-xl border p-3"><div className="font-medium">Шива (7)</div><div>22.04</div></div>
          <div className="bg-white rounded-xl border p-3"><div className="font-medium">40 дней</div><div>25.05</div></div>
          <div className="bg-white rounded-xl border p-3"><div className="font-medium">Годовщина</div><div>12.04.26</div></div>
        </div>
        <Button className="w-full" variant="outline">Открыть чат траура</Button>
      </CardContent></Card>
    </div>
  );
}

function SynagogueScreen({ onBack }: { onBack: () => void }) {
  const [admin, setAdmin] = useState(false);
  return (
    <div className="p-4 pb-24">
      <TopBar title="Синагога Дербентская" onBack={onBack} right={<button className="text-xs underline" onClick={()=>setAdmin(!admin)}>{admin?"Режим прихожанина":"Режим раввина"}</button>} />
      <Card className="rounded-2xl"><CardContent className="p-4 space-y-3">
        <div className="text-sm text-neutral-700">Расписание молитв</div>
        {[["Шахарит","08:30"],["Минха","18:30"],["Арвит","19:10"]].map(([t, h],i)=> (
          <div key={i} className="flex items-center justify-between bg-white rounded-xl border p-3">
            <div className="font-medium">{t}</div>
            {admin ? (
              <div className="flex items-center gap-2">
                <Input defaultValue={h as string} className="w-24 h-8" />
                <Button size="sm" className="h-8 bg-[#E08E45] hover:bg-[#cf7b35]">Сохранить</Button>
              </div>
            ) : (
              <div className="text-sm text-neutral-600">{h}</div>
            )}
          </div>
        ))}
        <div className="text-xs text-neutral-500">Подпишитесь, чтобы получать напоминания за 1 час до молитвы.</div>
        <Button className="w-full">Подписаться</Button>
      </CardContent></Card>
    </div>
  );
}

function FeedScreen() {
  return (
    <div className="p-4 pb-24">
      <TopBar title="Лента" />
      <div className="space-y-3">
        {[{t:"Поздравьте Яэль и Давида со свадьбой", s:"Сегодня"},{t:"Годовщина у семьи Давидовых", s:"Завтра"},{t:"Фото с Бар Мицвы", s:"Вчера"}].map((p,i)=>(
          <div key={i} className="bg-white rounded-2xl p-4 shadow">
            <div className="text-xs text-neutral-500 mb-1">{p.s}</div>
            <div className="font-medium">{p.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("home");
  const [route, setRoute] = useState<string | null>(null);

  const go = (r: string) => setRoute(r);
  const back = () => setRoute(null);

  return (
    <div className="min-h-screen bg-[#FDF6F0] text-neutral-900 flex flex-col items-center">
      <div className="w-full max-w-md border-x min-h-screen bg-[rgba(255,255,255,0.6)]">
        {!authed ? (
          <InviteFlow onDone={() => setAuthed(true)} />
        ) : (
          <>
            <AnimatePresence mode="wait">
              {!route && tab === "home" && (
                <motion.div key="home" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <HomeScreen go={go} />
                </motion.div>
              )}
              {!route && tab === "tree" && (
                <motion.div key="tree" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <TreeScreen />
                </motion.div>
              )}
              {!route && tab === "groups" && (
                <motion.div key="groups" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <GroupsScreen openChat={()=>go("chat")} />
                </motion.div>
              )}
              {!route && tab === "calendar" && (
                <motion.div key="calendar" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <CalendarScreen goToWedding={()=>go("wedding")} />
                </motion.div>
              )}
              {!route && tab === "profile" && (
                <motion.div key="profile" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <div className="p-4 pb-24">
                    <TopBar title="Профиль" />
                    <Card className="rounded-2xl"><CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <img src="https://images.unsplash.com/photo-1547721064-da6cfb341d50?q=80&w=200&auto=format&fit=crop" className="w-14 h-14 rounded-full"/>
                        <div>
                          <div className="font-semibold">Давид Абрамов</div>
                          <div className="text-xs text-neutral-500">Род: Абрамовы • Москва</div>
                        </div>
                      </div>
                      <Button className="w-full">Редактировать</Button>
                    </CardContent></Card>
                  </div>
                </motion.div>
              )}

              {route === "chat" && (
                <motion.div key="chat" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <ChatScreen onBack={back} />
                </motion.div>
              )}
              {route === "wedding" && (
                <motion.div key="wedding" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <WeddingScreen onBack={back} />
                </motion.div>
              )}
              {route === "brit" && (
                <motion.div key="brit" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <WeddingScreen onBack={back} />
                </motion.div>
              )}
              {route === "bar" && (
                <motion.div key="bar" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <WeddingScreen onBack={back} />
                </motion.div>
              )}
              {route === "mourning" && (
                <motion.div key="mourning" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <MourningScreen onBack={back} />
                </motion.div>
              )}
              {route === "synagogue" && (
                <motion.div key="synagogue" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <SynagogueScreen onBack={back} />
                </motion.div>
              )}
              {route === "feed" && (
                <motion.div key="feed" variants={container} initial="hidden" animate="show" exit={{opacity:0}}>
                  <FeedScreen />
                </motion.div>
              )}
            </AnimatePresence>
            <BottomNav current={tab} setCurrent={setTab} />
          </>
        )}
      </div>
    </div>
  );
}

