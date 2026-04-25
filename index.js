const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

// ⚠️ DOLDUR
const TOKEN = "MTQ5NzMzOTM4Nzc2MTkxNzk3Mg.GZ3XAy.K4iXEctHtKt_Shg2dXj4eNBIJMj2UErqiaOoAg";
const CLIENT_ID = "1497339387761917972";
const GUILD_ID = "1497331159951212644";
const OWNER_ID = "1496977806603587584";

// 📍 ŞİKAYET KANALLARI
const sikayetKanallari = [
  "1497337533883879474",
  "1497337611411525813"
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔹 KOMUTLAR
const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Kullanıcı paneli")
    .addUserOption(o =>
      o.setName("kullanici")
       .setDescription("Kullanıcı seç")
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("yaz")
    .setDescription("Bot mesaj atsın")
    .addChannelOption(o =>
      o.setName("kanal")
       .setDescription("Kanal seç")
       .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mesaj")
       .setDescription("Mesaj yaz")
       .setRequired(true)
    )
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("Komutlar yüklendi");
})();

let kufurPuan = {};

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();
  const id = message.author.id;

  // 🔒 OWNER KORUMA
  if (id === OWNER_ID) return;

  // =====================
  // 🟡 ŞİKAYET SİSTEMİ
  // =====================
  if (sikayetKanallari.includes(message.channel.id)) {

    const gecerli =
      msg.includes("şikayet") ||
      msg.includes("şikayetçiyim") ||
      msg.includes("şikayet var");

    if (!gecerli) {
      try { await message.delete(); } catch {}

      try {
        await message.member.timeout(25 * 60 * 1000);
        message.channel.send(`⛔ ${message.author} sadece şikayet yazabilirsin!`);
      } catch {}

      return;
    }

    return;
  }

  // =====================
  // 🔴 KÜFÜR SİSTEMİ (FIXLENMİŞ)
  // =====================

  if (msg.includes("amk")) return;

  const kufurler = [
    "orospu","oç","piç","siktir","amına koy","yarrak","göt"
  ];

  if (kufurler.some(k => msg.includes(k))) {

    if (!kufurPuan[id]) kufurPuan[id] = 0;
    kufurPuan[id]++;

    const puan = kufurPuan[id];

    console.log("KÜFÜR:", msg, "PUAN:", puan);

    if (puan === 1) {
      return message.reply("⚠️ Küfür etme! (1. uyarı)");
    }

    if (puan >= 15) {
      try {
        await message.member.ban({ reason: "15 küfür" });
        return message.channel.send("💀 15 uyarı sonrası BAN");
      } catch {}
    }

    let dakika = (puan - 1) * 10;

    try {
      await message.member.timeout(dakika * 60 * 1000);
      message.reply(`🔇 ${dakika} dk susturuldun (${puan}. uyarı)`);
    } catch (e) {
      console.log("HATA:", e);
    }
  }
});

client.once("ready", () => {
  console.log("BOT AÇILDI 🔥");
});

// 🔘 PANEL + YAZ
client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {

    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: "❌ Yetki yok", ephemeral: true });
    }

    if (interaction.commandName === "panel") {
      const user = interaction.options.getUser("kullanici");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ban_${user.id}`)
          .setLabel("🔨 Ban")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId(`unban_${user.id}`)
          .setLabel("🔓 Unban")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: `${user.tag} için panel`,
        components: [row],
        ephemeral: true
      });
    }

    if (interaction.commandName === "yaz") {
      const kanal = interaction.options.getChannel("kanal");
      const mesaj = interaction.options.getString("mesaj");

      try {
        await kanal.send(mesaj);
        return interaction.reply({ content: "✅ Gönderildi", ephemeral: true });
      } catch {
        return interaction.reply({ content: "❌ Hata", ephemeral: true });
      }
    }
  }

  if (interaction.isButton()) {

    await interaction.deferReply({ ephemeral: true });

    const [islem, id] = interaction.customId.split("_");
    const guild = interaction.guild;

    try {
      if (islem === "ban") {
        const uye = await guild.members.fetch(id);
        await uye.ban();
        return interaction.editReply("💀 Ban atıldı");
      }

      if (islem === "unban") {
        await guild.members.unban(id);
        return interaction.editReply("✅ Ban kaldırıldı");
      }

    } catch {
      return interaction.editReply("❌ Hata");
    }
  }
});

client.login(TOKEN);