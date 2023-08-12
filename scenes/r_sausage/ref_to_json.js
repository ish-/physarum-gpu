const info = [...$$('ellipse')].map($el => [
    $el.cx.baseVal.value,
    $el.cy.baseVal.value,
    $el.rx.baseVal.value,
    $el.ry.baseVal.value,
])