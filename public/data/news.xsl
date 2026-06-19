<?xml version="1.0" encoding="UTF-8"?>
<!-- news.xsl : XSLT 1.0 stylesheet.
     Transforms the <news> XML document into a list of HTML news items.
     It is applied in the browser by data-loader.js using XSLTProcessor. -->
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" indent="yes" omit-xml-declaration="yes"/>

  <!-- Root: loop over each release and build a news item. -->
  <xsl:template match="/news">
    <div class="news-list">
      <xsl:apply-templates select="release"/>
    </div>
  </xsl:template>

  <!-- One press release -> one styled block. -->
  <xsl:template match="release">
    <article class="news-item">
      <div class="date">
        <xsl:call-template name="formatDate">
          <xsl:with-param name="d" select="date"/>
        </xsl:call-template>
        <span class="tag"><xsl:value-of select="category"/></span>
      </div>
      <h3><xsl:value-of select="title"/></h3>
      <p><xsl:value-of select="summary"/></p>
    </article>
  </xsl:template>

  <!-- Named template: convert YYYY-MM-DD into "DD Mon YYYY". -->
  <xsl:template name="formatDate">
    <xsl:param name="d"/>
    <xsl:variable name="y" select="substring($d, 1, 4)"/>
    <xsl:variable name="m" select="substring($d, 6, 2)"/>
    <xsl:variable name="day" select="substring($d, 9, 2)"/>
    <xsl:variable name="mon">
      <xsl:choose>
        <xsl:when test="$m = '01'">Jan</xsl:when>
        <xsl:when test="$m = '02'">Feb</xsl:when>
        <xsl:when test="$m = '03'">Mar</xsl:when>
        <xsl:when test="$m = '04'">Apr</xsl:when>
        <xsl:when test="$m = '05'">May</xsl:when>
        <xsl:when test="$m = '06'">Jun</xsl:when>
        <xsl:when test="$m = '07'">Jul</xsl:when>
        <xsl:when test="$m = '08'">Aug</xsl:when>
        <xsl:when test="$m = '09'">Sep</xsl:when>
        <xsl:when test="$m = '10'">Oct</xsl:when>
        <xsl:when test="$m = '11'">Nov</xsl:when>
        <xsl:otherwise>Dec</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:value-of select="concat($day, ' ', $mon, ' ', $y)"/>
  </xsl:template>

</xsl:stylesheet>
