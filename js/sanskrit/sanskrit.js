/**
 * a simple script to convert all the itrans text in span tagged
 * with class 'trans-sanskrit' in a webpage to sanskrit lipi
 */

(function () {
    let elems = document.getElementsByClassName("trans-sanskrit");
    for(let i=0; i<elems.length; i++) {
      let txt = elems[i].innerText;
      elems[i].setAttribute("otherTxt", txt);
      elems[i].innerHTML = genHTML(genSanskrit(txt), "Source");
    }
})();

function genSanskrit(txt) {
  let out = "";
  for(let j=0; j<txt.length; j++) {
    out = convert(out + txt[j]);
  }
  return out;
}

function genHTML(txt, btnTxt) {
  return `<span class="source-switch" onclick="swapSource(this.parentNode)">${btnTxt}</span>${txt}`;
}

function swapSource(e) {
  let chld = e.getElementsByTagName("span")[0];
  let btnTxt = chld.innerText == "Source" ? "Sanskrit" : "Source"
  e.removeChild(chld)
  var old = e.innerText;
  e.innerHTML = genHTML(e.getAttribute("otherTxt"), btnTxt);
  e.setAttribute("otherTxt", old);
}

function convert(txt) {
  txt = txt.replace(/a/g, 'अ');
  txt = txt.replace(/[AāĀ]/g, 'आ');
  txt = txt.replace(/i/g, 'इ');
  txt = txt.replace(/[IīĪ]/g, 'ई');
  txt = txt.replace(/u/g, 'उ');
  txt = txt.replace(/[UūŪ]/g, 'ऊ');
  txt = txt.replace(/अअ/g, 'आ');
  txt = txt.replace(/इइ/g, 'ई');
  txt = txt.replace(/उउ/g, 'ऊ');
  txt = txt.replace(/[eē]/g, 'ए');
  txt = txt.replace(/[oō]/g, 'ओ');
  txt = txt.replace(/अइ/g, 'ऐ');
  txt = txt.replace(/अउ/g, 'औ');
  // suppression du virama 
  txt = txt.replace(/िइ/g, 'ी');
  txt = txt.replace(/ुउ/g, 'ू');
  txt = txt.replace(/्अ/g, '​');
  txt = txt.replace(/\u200bअ/g, 'ा');
  txt = txt.replace(/\u200bइ/g, 'ै');
  txt = txt.replace(/\u200bउ/g, 'ौ');
  txt = txt.replace(/्आ/g, 'ा');
  txt = txt.replace(/्इ/g, 'ि');
  txt = txt.replace(/्ई/g, 'ी');
  txt = txt.replace(/्उ/g, 'ु');
  txt = txt.replace(/्ऊ/g, 'ू');
  txt = txt.replace(/्ऋ/g, 'ृ');
  txt = txt.replace(/्ॠ/g, 'ॄ');
  txt = txt.replace(/्ऌ/g, 'ॢ');
  txt = txt.replace(/्ॡ/g, 'ॣ');
  txt = txt.replace(/्ए/g, 'े');
  txt = txt.replace(/्ओ/g, 'ो');
  txt = txt.replace(/्ऐ/g, 'ै'); //ajoutai
  txt = txt.replace(/्औ/g, 'ौ'); //ajoutau
  txt = txt.replace(/्᳭/g, '᳭'); // vedique tiryak non spacing
  // retrait ligne hindi  car = car.replace(/् /g, " ");
  //cons
  txt = txt.replace(/n/g, 'न्');
  txt = txt.replace(/k/g, 'क्');
  txt = txt.replace(/g/g, 'ग्');
  txt = txt.replace(/c/g, 'च्');
  txt = txt.replace(/j/g, 'ज्');
  txt = txt.replace(/[TṭṬ]/g, 'ट्');
  txt = txt.replace(/[DḍḌ]/g, 'ड्');
  txt = txt.replace(/[NṇṆ]/g, 'ण्');
  txt = txt.replace(/t/g, 'त्');
  txt = txt.replace(/d/g, 'द्');
  txt = txt.replace(/p/g, 'प्');
  txt = txt.replace(/b/g, 'ब्');
  txt = txt.replace(/m/g, 'म्');
  // car = car.replace(/q/g, "क़्");
  // car = car.replace(/x/g, "ख़्");
  // car = car.replace(/Y/g, "ग़्");
  // car = car.replace(/z/g, "ज़्");
  // car = car.replace(/f/g, "फ़्");
  // car = car.replace(/R/g, "ड़्");
  // car = car.replace(/f/g, "फ़्");
  txt = txt.replace(/y/g, 'य्');
  txt = txt.replace(/r/g, 'र्');
  txt = txt.replace(/l/g, 'ल्');
  txt = txt.replace(/L/g, 'ळ्');
  txt = txt.replace(/v/g, 'व्');
  txt = txt.replace(/w/g, 'व्');
  txt = txt.replace(/h/g, 'ह्');
  txt = txt.replace(/[SṣṢ]/g, 'ष्');
  txt = txt.replace(/s/g, 'स्');
  // cas particuliers
  txt = txt.replace(/[GṅṄ]/g, 'ङ्');
  txt = txt.replace(/[Jñ]/g, 'ञ्');
  //car = car.replace(/न्ग्/g, "ङ्");
  //car = car.replace(/न्ज्/g, "ञ्");
  // aspirées
  txt = txt.replace(/क्ह्/g, 'ख्');
  txt = txt.replace(/ग्ह्/g, 'घ्');
  txt = txt.replace(/च्ह्/g, 'छ्');
  txt = txt.replace(/ज्ह्/g, 'झ्');
  txt = txt.replace(/ट्ह्/g, 'ठ्');
  txt = txt.replace(/ड्ह्/g, 'ढ्');
  txt = txt.replace(/त्ह्/g, 'थ्');
  txt = txt.replace(/द्ह्/g, 'ध्');
  txt = txt.replace(/त्ह्/g, 'थ्');
  txt = txt.replace(/द्ह्/g, 'ध्');
  txt = txt.replace(/प्ह्/g, 'फ्');
  txt = txt.replace(/ब्ह्/g, 'भ्');
  txt = txt.replace(/ड़्ह्/g, 'ढ़्');
  // cas du s barre
  txt = txt.replace(/स्ह्/g, 'श्');
  txt = txt.replace(/[çśŚ]/g, 'श्');
  // cas du ri li 
  txt = txt.replace(/्-र्/g, 'ृ');
  txt = txt.replace(/-र्/g, 'ऋ');
  txt = txt.replace(/ऋइ/g, 'ॠ');
  txt = txt.replace(/ृइ/g, 'ॄ');
  txt = txt.replace(/[ṛṚ]/g, 'ऋ');
  txt = txt.replace(/[ṝṜ]/g, 'ॠ');
  txt = txt.replace(/[ḷḶ]/g, 'ऌ');
  txt = txt.replace(/[ḹḸ]/g, 'ॡ');
  txt = txt.replace(/्-ल्/g, 'ॢ');
  txt = txt.replace(/-ल्/g, 'ऌ');
  txt = txt.replace(/ऌइ/g, 'ॡ');
  txt = txt.replace(/ॢइ/g, 'ॣ');
  //suppression du zero
  txt = txt.replace(/\u200bक/g, 'क');
  txt = txt.replace(/\u200bख/g, 'ख');
  txt = txt.replace(/\u200bग/g, 'ग');
  txt = txt.replace(/\u200bघ/g, 'घ');
  txt = txt.replace(/\u200bङ/g, 'ङ');
  txt = txt.replace(/\u200bच/g, 'च');
  txt = txt.replace(/\u200bछ/g, 'छ');
  txt = txt.replace(/\u200bज/g, 'ज');
  txt = txt.replace(/\u200bझ/g, 'झ');
  txt = txt.replace(/\u200bञ/g, 'ञ');
  txt = txt.replace(/\u200bट/g, 'ट');
  txt = txt.replace(/\u200bठ/g, 'ठ');
  txt = txt.replace(/\u200bड/g, 'ड');
  txt = txt.replace(/\u200bढ/g, 'ढ');
  txt = txt.replace(/\u200bण/g, 'ण');
  txt = txt.replace(/\u200bत/g, 'त');
  txt = txt.replace(/\u200bथ/g, 'थ');
  txt = txt.replace(/\u200bद/g, 'द');
  txt = txt.replace(/\u200bध/g, 'ध');
  txt = txt.replace(/\u200bन/g, 'न');
  txt = txt.replace(/\u200bप/g, 'प');
  txt = txt.replace(/\u200bफ/g, 'फ');
  txt = txt.replace(/\u200bब/g, 'ब');
  txt = txt.replace(/\u200bभ/g, 'भ');
  txt = txt.replace(/\u200bम/g, 'म');
  txt = txt.replace(/\u200bक़/g, 'क़');
  txt = txt.replace(/\u200bख़/g, 'ख़');
  txt = txt.replace(/\u200bग़/g, 'ग़');
  txt = txt.replace(/\u200bज़/g, 'ज़');
  txt = txt.replace(/\u200bड़/g, 'ड़');
  txt = txt.replace(/\u200bढ़/g, 'ढ़');
  txt = txt.replace(/\u200bफ़/g, 'फ़');
  txt = txt.replace(/\u200bय/g, 'य');
  txt = txt.replace(/\u200bर/g, 'र');
  txt = txt.replace(/\u200bल/g, 'ल');
  txt = txt.replace(/\u200bळ/g, 'ळ');
  txt = txt.replace(/\u200bव/g, 'व');
  txt = txt.replace(/\u200bह/g, 'ह');
  txt = txt.replace(/\u200bश/g, 'श');
  txt = txt.replace(/\u200bष/g, 'ष');
  txt = txt.replace(/\u200bस/g, 'स');
  txt = txt.replace(/\u200b /g, ' '); // pb finales
  txt = txt.replace(/\u200b\ं/g, 'ं');
  txt = txt.replace(/\u200b\ः/g, 'ः');
  // accents
  txt = txt.replace(/\u200b\॓/g, '॓');
  txt = txt.replace(/\u200b\॔/g, '॔');
  txt = txt.replace(/\u200b\़/g, '़');
  txt = txt.replace(/\u200b\़/g, 'ँ');
  // anusvara
  txt = txt.replace(/[MṃṂṁ]/g, 'ं');
  txt = txt.replace(/्ं/g, 'ं');
  // candrabindu 
  txt = txt.replace(/ंं/g, 'ँ');
  //OM
  txt = txt.replace(/O/g, 'ॐ');
  txt = txt.replace(/ॐं/g, 'ॐ');
  // visarga
  txt = txt.replace(/[HḥḤ]/g, 'ः');
  txt = txt.replace(/्ः/g, 'ः');
  // anudatta
  txt = txt.replace(/_/g, '॒');
  txt = txt.replace(/\u200b॒/g, '॒');
  // alternative : car = car.replace(/:/g, "ः");
  // avagraha
  txt = txt.replace(/\'/g, 'ऽ');
  txt = txt.replace(/’/g, 'ऽ');
  // ponctuation
  txt = txt.replace(/\|/g, '।');
  txt = txt.replace(/\//g, '।');
  txt = txt.replace(/।।/g, '॥');
  //half conso
  txt = txt.replace(/x/g, '‍');
  txt = txt.replace(/\u200d\u200d/g, '‌');
  txt = txt.replace(/0/g, '०');
  txt = txt.replace(/1/g, '१');
  txt = txt.replace(/2/g, '२');
  txt = txt.replace(/3/g, '३');
  txt = txt.replace(/4/g, '४');
  txt = txt.replace(/5/g, '५');
  txt = txt.replace(/6/g, '६');
  txt = txt.replace(/7/g, '७');
  txt = txt.replace(/8/g, '८');
  txt = txt.replace(/9/g, '९');
  return txt;
}
