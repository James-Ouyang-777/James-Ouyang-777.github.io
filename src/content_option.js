const logotext = "JAMES";
const meta = {
    title: "James Ouyang",
    description: "I'm James Ouyang data scientist _ Full stack devloper",
};

const introdata = {
    title: "Hi 👋, \n I'm James Ouyang",
    animated: {
        first: "I love solving problems",
        second: "I believe in a promising future for software & AI",
        third: "I build fun (& sometimes useful) AI projects",
    },
    description: "Aspiring quant, AI/ML engineer. Check out My Portfolio to see 👇 some of my most interesting work! ",
    your_img_url: "https://i.imgur.com/79m29zq.png",
};

const dataabout = {
    title: "A bit about my self",
    aboutme: "I am a recent Computer Science graduate from the University of Waterloo, actively seeking full-time opportunities. I'm looking for a challenging and stimulating work environment where I can apply my skills, grow professionally, and contribute meaningfully to impactful projects.",
};
const worktimeline = [
    {
        jobtitle: "Quantitative Researcher",
        where: "Trexquant Investment LP",
        date: "September 2024 - December 2025",
    },
    {
        jobtitle: "ML Engineer",
        where: "ODAIA",
        date: "January 2024 - April 2024",
    },
    {
        jobtitle: "AI/ML Engineer",
        where: "Genellipse",
        date: "September 2022 - December 2023",
    },
    {
    jobtitle: "Data Scientist",
    where: "Transport Canada",
    date: "January 2022 - August 2022",
    },
    {
        jobtitle: "AI Research Intern",
        where: "Microsoft",
        date: "May 2021 - August 2021",
    },
    // {
    //     jobtitle: "Data Engineer",
    //     where: "BMT",
    //     date: "December 2020 - April 2021",
    // },

];

const skills = [{
        name: "Python",
        value: 95,
    },
    {
        name: "SQL",
        value: 90,
    },
    {
        name: "C++",
        value: 85,
    },
    // {
    //     name: "Javascript",
    //     value: 80,
    // },
    // {
    //     name: "React",
    //     value: 70,
    // },

];

const services = [{
        title: "Applied AI",
        description: "My passion for Applied AI and leveraging its problem-solving capabilities is a driving force that fuels my desire to contribute to the advancement of this transformative technology. Throughout my career, I aspire to make a significant positive impact on the world through AI's practical applications.",
    },
    {
        title: "Web/Game Development",
        description: "Developing multiplayer games is one of my favorite pastimes. I believe that these games offer an exciting opportunity for people to come together and have fun as a group. They're not just about entertainment; they also promote teamwork and cooperation among players, making them a fantastic team-building activity.",
    },
    {
        title: "Quantitative Trading",
        description: " I've always had a keen interest in capital markets and trading. Exploring these areas has become a personal passion of mine. I spend a significant amount of time reading, studying, and staying up-to-date on financial news to satisfy my curiosity and deepen my knowledge.",
    },
    {
        title: "Music Production",
        description: "As a hobbyist, I enjoy creating EDM mixes in my free time. This creative outlet allows me to experiment with various sounds and styles, giving me the freedom to craft unique and engaging musical compositions..",
    },
];

const dataportfolio = [
    
    {
        img: "https://imgur.com/6MESHnF.png",
        description: "The Donna: your very own personal legal secretary chatbot. ",
        link: "/donna",
    },

    {
        img: require("./assets/images/icon2.webp"),
        description: "PromptTester: A/B Testing Framework for LLM Prompts",
        link: "https://github.com/James-Ouyang-777/PromptTester",
    },
    // {
    //     img: "https://i.imgur.com/qXwG4y9.png",
    //     description: "Trader AI Repo",
    //     link: "https://github.com/James-Ouyang-777/NEAT-Trader-Sample",
    // },
    // {
    //     img: "https://picsum.photos/400/800/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },

    {
        img: "https://i.imgur.com/9Txw70T.png",
        description: "Stock Trading Insights",
        link: "https://jamesouyangfinsight.streamlit.app/",
    },
    {
        img: "https://i.imgur.com/OAQPOKI.png",
        description: "Computer Vision Animal Identifier",
        link: "https://github.com/James-Ouyang-777/CVPets",
    },

    // {
    //     img: "https://picsum.photos/400/300/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/700/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },

    // {
    //     img: "https://picsum.photos/400/600/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/300/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/550/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
    // {
    //     img: "https://picsum.photos/400/700/?grayscale",
    //     description: "The wisdom of life consists in the elimination of non-essentials.",
    //     link: "#",
    // },
];

const contactConfig = {
    YOUR_EMAIL: "j23ouyan@uwaterloo.ca",
    YOUR_FONE: "(647)-890-3584",
    // description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vehicula eu nunc et sollicitudin. Cras pulvinar, nisi at imperdiet pharetra. ",
    // creat an emailjs.com account 
    // check out this tutorial https://www.emailjs.com/docs/examples/reactjs/
    YOUR_SERVICE_ID: "service_id",
    YOUR_TEMPLATE_ID: "template_id",
    YOUR_USER_ID: "user_id",
};

const DonnaDesc = {
    YOUR_EMAIL: "j23ouyan@uwaterloo.ca",
    YOUR_FONE: "(555)123-4567",
    description: "Have a chat with the fan-favorite legal secretary from the \"Suits\" TV Series." ,
    // creat an emailjs.com account 
    // check out this tutorial https://www.emailjs.com/docs/examples/reactjs/
    YOUR_SERVICE_ID: "service_id",
    YOUR_TEMPLATE_ID: "template_id",
    YOUR_USER_ID: "user_id",
};

const socialprofils = {
    github: "https://github.com/James-Ouyang-777",
    facebook: "https://facebook.com",
    linkedin: "https://www.linkedin.com/in/james-ouyang/",
    twitter: "https://twitter.com",
    email: "mailto:jamesouyang02@gmail.com"
};
export {
    meta,
    dataabout,
    dataportfolio,
    worktimeline,
    skills,
    services,
    introdata,
    contactConfig,
    socialprofils,
    logotext,
    DonnaDesc
};