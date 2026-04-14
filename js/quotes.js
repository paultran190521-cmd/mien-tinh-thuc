/**
 * SUNNYCARE MindWell — Psychology Quotes
 * 30 bilingual (VI/EN) inspirational quotes from psychology & philosophy
 */

const PSYCHOLOGY_QUOTES = [
  {
    vi: "Nghịch lý kỳ diệu là khi tôi chấp nhận bản thân như tôi vốn là, thì tôi có thể thay đổi.",
    en: "The curious paradox is that when I accept myself just as I am, then I can change.",
    author: "Carl Rogers"
  },
  {
    vi: "Dễ bị tổn thương không phải là thắng hay thua — đó là can đảm xuất hiện khi bạn không thể kiểm soát kết quả.",
    en: "Vulnerability is not winning or losing; it's having the courage to show up when we have no control over the outcome.",
    author: "Brené Brown"
  },
  {
    vi: "Khi ta không còn khả năng thay đổi hoàn cảnh, ta được thách thức để thay đổi chính mình.",
    en: "When we are no longer able to change a situation, we are challenged to change ourselves.",
    author: "Viktor E. Frankl"
  },
  {
    vi: "Cảm xúc đến rồi đi như mây trên bầu trời gió. Hơi thở có ý thức là mỏ neo của tôi.",
    en: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.",
    author: "Thích Nhất Hạnh"
  },
  {
    vi: "Tôi không phải là những gì đã xảy ra với tôi — tôi là những gì tôi chọn để trở thành.",
    en: "I am not what happened to me; I am what I choose to become.",
    author: "Carl Gustav Jung"
  },
  {
    vi: "Bạn là bầu trời. Mọi thứ khác — chỉ là thời tiết mà thôi.",
    en: "You are the sky. Everything else is just the weather.",
    author: "Pema Chödrön"
  },
  {
    vi: "Bạn có thể không kiểm soát được mọi sự kiện xảy ra với mình, nhưng bạn có thể quyết định không để chúng làm bạn nhỏ lại.",
    en: "You may not control all the events that happen to you, but you can decide not to be reduced by them.",
    author: "Maya Angelou"
  },
  {
    vi: "Ngoài kia, vượt qua mọi ý niệm về đúng và sai, có một vùng đất rộng mở. Tôi sẽ gặp bạn ở đó.",
    en: "Out beyond ideas of wrongdoing and rightdoing, there is a field. I'll meet you there.",
    author: "Rumi"
  },
  {
    vi: "Lòng trắc ẩn với bản thân là trao cho mình sự tử tế như ta trao cho người khác.",
    en: "Self-compassion is simply giving the same kindness to ourselves that we would give to others.",
    author: "Kristin Neff"
  },
  {
    vi: "Ở bất kỳ khoảnh khắc nào, chúng ta có hai lựa chọn: bước về phía trước để trưởng thành, hay lùi về phía sau để an toàn.",
    en: "In any given moment we have two options: to step forward into growth or to step back into safety.",
    author: "Abraham Maslow"
  },
  {
    vi: "Đừng để hành vi của người khác phá vỡ sự bình yên nội tâm của bạn.",
    en: "Do not let the behavior of others destroy your inner peace.",
    author: "Đức Đạt-lai Lạt-ma"
  },
  {
    vi: "Giữa mùa đông tăm tối nhất, cuối cùng tôi nhận ra rằng trong tôi có một mùa hè bất diệt.",
    en: "In the depths of winter, I finally learned that within me there lay an invincible summer.",
    author: "Albert Camus"
  },
  {
    vi: "Hãy mỉm cười, hít thở và sống chậm lại.",
    en: "Smile, breathe, and go slowly.",
    author: "Thích Nhất Hạnh"
  },
  {
    vi: "Con người cũng kỳ diệu như những hoàng hôn — nếu bạn dành không gian để họ hiện diện.",
    en: "People are just as wonderful as sunsets if you let them be.",
    author: "Carl Rogers"
  },
  {
    vi: "Tất cả đều có thể bị tước đoạt — chỉ có một thứ không thể: quyền tự do chọn thái độ của mình trong bất kỳ hoàn cảnh nào.",
    en: "Everything can be taken from a man but one thing: the last of human freedoms — to choose one's attitude in any given set of circumstances.",
    author: "Viktor E. Frankl"
  },
  {
    vi: "Chấp nhận câu chuyện của mình và yêu thương bản thân trong quá trình đó là hành động dũng cảm nhất ta từng làm.",
    en: "Owning our story and loving ourselves through that process is the bravest thing that we'll ever do.",
    author: "Brené Brown"
  },
  {
    vi: "Hôm qua tôi thông minh, nên tôi muốn thay đổi thế giới. Hôm nay tôi khôn ngoan, nên tôi đang thay đổi chính mình.",
    en: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
    author: "Rumi"
  },
  {
    vi: "Điều đáng sợ nhất là chấp nhận hoàn toàn chính mình.",
    en: "The most terrifying thing is to accept oneself completely.",
    author: "Carl Gustav Jung"
  },
  {
    vi: "Không phải tìm hiểu tại sao nghiện — mà tìm hiểu tại sao có nỗi đau.",
    en: "Not why the addiction, but why the pain.",
    author: "Gabor Maté"
  },
  {
    vi: "Hãy bắt đầu từ nơi bạn đang đứng. Dùng những gì bạn đang có. Làm những gì bạn có thể.",
    en: "Start where you are. Use what you have. Do what you can.",
    author: "Pema Chödrön"
  },
  {
    vi: "Khoảnh khắc hiện tại là khoảnh khắc duy nhất thực sự tồn tại với chúng ta.",
    en: "The present moment is the only moment truly available to us.",
    author: "Thích Nhất Hạnh"
  },
  {
    vi: "Sứ mệnh của tôi không chỉ là sống sót — mà là sống trọn vẹn.",
    en: "My mission in life is not merely to survive, but to thrive.",
    author: "Maya Angelou"
  },
  {
    vi: "Không phải điều gì xảy ra với bạn, mà cách bạn phản ứng với nó mới là điều thực sự quan trọng.",
    en: "It's not what happens to you, but how you react to it that matters.",
    author: "Epictetus"
  },
  {
    vi: "Cuộc sống tốt đẹp là một quá trình tiến hành — không phải một trạng thái cố định.",
    en: "The good life is a process, not a state of being.",
    author: "Carl Rogers"
  },
  {
    vi: "Chấn thương không phải là điều xảy ra với bạn, mà là điều xảy ra bên trong bạn do những gì đã xảy ra.",
    en: "Trauma is not what happens to you, but what happens inside you as a result of what happened to you.",
    author: "Gabor Maté"
  },
  {
    vi: "Với lòng trắc ẩn tự thân, ta trao cho mình sự ân cần như ta dành cho người bạn thân nhất.",
    en: "With self-compassion, we give ourselves the same kindness and care we'd give to a good friend.",
    author: "Kristin Neff"
  },
  {
    vi: "Nỗi đau của bạn là sự vỡ ra của lớp vỏ bao bọc sự hiểu biết của bạn.",
    en: "Your pain is the breaking of the shell that encloses your understanding.",
    author: "Khalil Gibran"
  },
  {
    vi: "Người nào có lý do để sống có thể chịu đựng hầu hết mọi cách sống.",
    en: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche"
  },
  {
    vi: "Kết nối là năng lượng được tạo ra giữa người với người khi họ cảm thấy được nhìn thấy, được lắng nghe và được trân trọng.",
    en: "Connection is the energy that is created between people when they feel seen, heard, and valued.",
    author: "Brené Brown"
  },
  {
    vi: "Chữa lành không đến trong đêm tối — nó đến từng bước nhỏ, mỗi ngày một nhịp thở.",
    en: "Healing doesn't happen overnight — it comes step by step, one breath at a time.",
    author: "SUNNYCARE"
  }
];

// Export for module use
if (typeof module !== 'undefined') module.exports = PSYCHOLOGY_QUOTES;
