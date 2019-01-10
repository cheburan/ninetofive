//import validation procedures
let uValid = require('../controllers/useful_func');



function sendSummury() {
  console.log('Im about to send');
  uValid.sendAnyEmail("Good morning, \n" +
      "\n" +
      "The NINEtoFIVE.work platform – a secure and anonymous online platform designed to facilitate discussions – was launched last week. All Newcastle University staff and PhD students are able to access the platform by visiting https://ninetofive.work. The system is being supported by Newcastle UCU, and thus the topics we chose to address first are: \n" +
      " \n" +
      "* Changes in working space, \n" +
      "* Fixed-term contracts, \n" +
      "* Academic promotions,\n" +
      "* PhD experience\n" +
      "* Any other University-related discussions.\n" +
      " \n" +
      "The platform, developed by a PhD student at Newcastle University, is entirely secure and anonymous (see https://ninetofive.work/about for details), which should help people express themselves freely.  At the same time, it will be moderated to avoid flame wars and to make sure no one’s anonymity is compromised accidentally.  New posts and comments will go up once a day, which should make for a more reflective, substantive discussion and one that makes room for more voices.  While the platform is being supported by UCU, it is open to all university employees and PhD students (including non-UCU members).\n" +
      "\n" +
      "This week we have launched polls on NINEtoFIVE. UCU will be using the results from these polls to inspire future campaigns, so we have had to restrict voting to once per user. \n" +
      "We would be very grateful if you could pass on this message to colleagues or fellow PhD students. UCU would like to gather the views of as many staff and students as possible to better understand your experiences of working or being a student at the University. There are several other polls planned for next week, so keep an eye out!\n" +
      "\n" +
      "\n" +
      "Best wishes, \n" +
      "Name.", "<p>\n" +
      "    Good morning, <br><br>\n" +
      "    The NINEtoFIVE.work platform – a secure and anonymous online platform designed to facilitate discussions – was launched last week.\n" +
      "    All Newcastle University staff and PhD students are able to access the platform by visiting https://ninetofive.work.\n" +
      "    The system is being supported by Newcastle UCU, and thus the topics we chose to address first are: <br>\n" +
      "    <ul>\n" +
      "        <li>Changes in working space, </li>\n" +
      "        <li>Fixed-term contracts, </li>\n" +
      "        <li>Academic promotions,</li>\n" +
      "        <li>PhD experience, </li>\n" +
      "        <li>Any other University-related discussions.</li>\n" +
      "    </ul>\n" +
      "\n" +
      "    The platform, developed by a PhD student at Newcastle University, is entirely secure and anonymous (see https://ninetofive.work/about for details), which should help people express themselves freely.  \n" +
      "    At the same time, it will be moderated to avoid flame wars and to make sure no one’s anonymity is compromised accidentally.\n" +
      "    New posts and comments will go up once a day, which should make for a more reflective, substantive discussion and one that makes room for more voices.  \n" +
      "    While the platform is being supported by UCU, it is open to all university employees and PhD students (including non-UCU members). <br>\n" +
      "\n" +
      "    This week we have launched polls on NINEtoFIVE. UCU will be using the results from these polls to inspire future campaigns, so we have had to restrict voting to once per user.<br>\n" +
      "    We would be very grateful if you could pass on this message to colleagues or fellow PhD students.\n" +
      "    UCU would like to gather the views of as many staff and students as possible to better understand your experiences of working or being a student at the University.\n" +
      "    There are several other polls planned for next week, so keep an eye out!<br><br>\n" +
      "\n" +
      "    Best wishes,<br>\n" +
      "    Name.\n" +
      "</p>", "subscription_test@mg.ninetofive.work", "NINEtoFIVE: Daily summary");
  console.log('Message sent');

}





/*let adduser = uValid.listAddUser('dinislam.am@gmail.com');
console.log(adduser);*/

/*let deleteUser = uValid.listDeleteuser('james.nicholson@northumbria.ac.uk');
console.log(deleteUser);

let updateUser = uValid.listUpdateUser('jopa@jopa.com', 'dinislam.am@gmail.com');
console.log(updateUser);*/




//sendSummury();

console.log(uValid.)





